import { NextRequest } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

interface DbUser {
  id: string;
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

  let { data: dbUser, error: userError } = await serviceSupabase
    .from('users')
    .select('id,generations_used,generation_limit,subscription_type,subscription_expires_at')
    .eq('id', user.id)
    .single();

  if (userError || !dbUser) {
    // Recover from manually deleted user profile rows by recreating defaults server-side.
    const { error: createError } = await serviceSupabase.from('users').upsert(
      {
        id: user.id,
        email: user.email ?? '',
        subscription_type: 'free',
        generations_used: 0,
        generation_limit: 5,
      },
      { onConflict: 'id' }
    );

    if (!createError) {
      const reloaded = await serviceSupabase
        .from('users')
        .select('id,generations_used,generation_limit,subscription_type,subscription_expires_at')
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
  const used = dbUser.generations_used ?? 0;
  const limit = dbUser.generation_limit;

  const hasActiveSubscription =
    dbUser.subscription_type === 'paid' &&
    dbUser.subscription_expires_at &&
    new Date(dbUser.subscription_expires_at) > new Date();

  if (hasActiveSubscription) return false;
  if (limit === null || limit === undefined) return false;

  return used >= limit;
}

export async function incrementGenerationUsage(serviceSupabase: SupabaseClient, userId: string, currentUsed: number) {
  await serviceSupabase
    .from('users')
    .update({ generations_used: currentUsed + 1 })
    .eq('id', userId);
}
