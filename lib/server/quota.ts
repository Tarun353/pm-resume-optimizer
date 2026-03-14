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

  let { data: dbUser, error: userError } = await serviceSupabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!dbUser) {
    const { error: createError } = await serviceSupabase.from('users').insert({
      id: user.id,
      email: user.email ?? '',
      subscription_type: 'free',
      downloads_used: 0,
    });

    if (!createError) {
      const reloaded = await serviceSupabase.from('users').select('*').eq('id', user.id).single();
      dbUser = reloaded.data;
      userError = reloaded.error;
    } else {
      await serviceSupabase.from('users').upsert(
        { id: user.id, email: user.email ?? '', subscription_type: 'free', downloads_used: 0 },
        { onConflict: 'id' }
      );
      const reloaded = await serviceSupabase.from('users').select('*').eq('id', user.id).single();
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
  const hasActiveSubscription =
    dbUser.subscription_type === 'paid' &&
    dbUser.subscription_expires_at &&
    new Date(dbUser.subscription_expires_at) > new Date();

  if (hasActiveSubscription) return false;

  // FIX: Do NOT fall back to downloads_used.
  // downloads_used is managed exclusively by /api/download/track.
  // Falling back caused double-counting: optimize incremented downloads_used,
  // then download/track incremented it again → quota hit after ~3 downloads instead of 5.
  if (dbUser.generations_used == null) {
    return false; // generations_used column not in DB yet — don't block
  }

  const limit = dbUser.generation_limit ?? 5;
  return dbUser.generations_used >= limit;
}

export async function incrementGenerationUsage(
  serviceSupabase: SupabaseClient,
  userId: string,
  currentUsed: number
) {
  // FIX: Only touch generations_used. Never downloads_used.
  // If column doesn't exist, silently fails — that's OK.
  await serviceSupabase
    .from('users')
    .update({ generations_used: currentUsed + 1 })
    .eq('id', userId);
}
