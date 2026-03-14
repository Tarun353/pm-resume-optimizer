import { NextRequest } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

interface DbUser {
  id: string;
  downloads_used?: number | null;
  generations_used?: number | null;
  generation_limit?: number | null;
  subscription_type?: string | null;
  subscription_expires_at?: string | null;
}

function getSupabaseClients() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceKey) {
    throw new Error('Supabase credentials not configured');
  }

  return {
    supabase: createClient(url, anonKey),
    serviceSupabase: createClient(url, serviceKey),
  };
}

export async function getAuthenticatedUserAndQuota(request: NextRequest): Promise<{
  userId: string;
  dbUser: DbUser;
  serviceSupabase: SupabaseClient;
}> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    throw new Error('UNAUTHORIZED');
  }

  const token = authHeader.replace('Bearer ', '');
  const { supabase, serviceSupabase } = getSupabaseClients();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    throw new Error('UNAUTHORIZED');
  }

  // Use SELECT * to avoid errors if some columns don't exist in this database yet
  let { data: dbUser, error: userError } = await serviceSupabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  // If user row is missing, create it
  if (!dbUser) {
    const { error: createError } = await serviceSupabase.from('users').insert({
      id: user.id,
      email: user.email ?? '',
      subscription_type: 'free',
      downloads_used: 0,
    });

    if (!createError) {
      const reloaded = await serviceSupabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      dbUser = reloaded.data;
      userError = reloaded.error;
    } else {
      // Try upsert as fallback
      await serviceSupabase.from('users').upsert(
        { id: user.id, email: user.email ?? '', subscription_type: 'free', downloads_used: 0 },
        { onConflict: 'id' }
      );

      const reloaded = await serviceSupabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      dbUser = reloaded.data;
      userError = reloaded.error;
    }
  }

  if (userError || !dbUser) {
    throw new Error('USER_NOT_FOUND');
  }

  return { userId: user.id, dbUser, serviceSupabase };
}

export function hasExceededGenerationQuota(dbUser: DbUser): boolean {
  // Use downloads_used if generations_used column doesn't exist yet
  const used = dbUser.generations_used ?? dbUser.downloads_used ?? 0;

  // Use a safe default limit if generation_limit column doesn't exist
  const limit = dbUser.generation_limit ?? 5;

  const hasActiveSubscription =
    dbUser.subscription_type === 'paid' &&
    dbUser.subscription_expires_at &&
    new Date(dbUser.subscription_expires_at) > new Date();

  // Premium users are never blocked
  if (hasActiveSubscription) return false;

  return used >= limit;
}

export async function incrementGenerationUsage(
  serviceSupabase: SupabaseClient,
  userId: string,
  currentUsed: number
) {
  // Try generations_used first; if the column doesn't exist, fall back to downloads_used
  const modernUpdate = await serviceSupabase
    .from('users')
    .update({ generations_used: currentUsed + 1 })
    .eq('id', userId);

  if (!modernUpdate.error) {
    return;
  }

  // Column doesn't exist — use downloads_used as fallback
  await serviceSupabase
    .from('users')
    .update({ downloads_used: currentUsed + 1 })
    .eq('id', userId);
}
