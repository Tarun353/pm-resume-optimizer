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

const DEFAULT_GENERATION_LIMIT = 5;

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

function isMissingUserRow(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const maybeCode = 'code' in error ? error.code : undefined;
  const maybeMessage = 'message' in error && typeof error.message === 'string' ? error.message : '';

  if (maybeCode === 'PGRST116') return true;
  return maybeMessage.includes('JSON object requested, multiple (or no) rows returned');
}

function isMissingColumnError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const maybeCode = 'code' in error ? error.code : undefined;
  const maybeMessage = 'message' in error && typeof error.message === 'string' ? error.message : '';

  if (maybeCode === '42703') return true;
  return maybeMessage.includes('column') && maybeMessage.includes('does not exist');
}

async function loadUserRow(serviceSupabase: SupabaseClient, userId: string) {
  const selectVariants = [
    'id,downloads_used,generations_used,generation_limit,subscription_type,subscription_expires_at',
    'id,downloads_used,generations_used,subscription_type,subscription_expires_at',
    'id,downloads_used,subscription_type,subscription_expires_at',
    'id,downloads_used,subscription_type',
  ];

  for (const selectClause of selectVariants) {
    const result = await serviceSupabase.from('users').select(selectClause).eq('id', userId).single();

    if (!result.error || !isMissingColumnError(result.error)) {
      return result;
    }
  }

  return serviceSupabase
    .from('users')
    .select('id,downloads_used,subscription_type')
    .eq('id', userId)
    .single();
}

async function createDefaultUserRow(serviceSupabase: SupabaseClient, userId: string, email: string) {
  const basePayload = {
    id: userId,
    email,
    subscription_type: 'free',
  };

  const payloadVariants = [
    { ...basePayload, generations_used: 0, generation_limit: DEFAULT_GENERATION_LIMIT },
    { ...basePayload, generations_used: 0 },
    { ...basePayload, downloads_used: 0 },
  ];

  for (const payload of payloadVariants) {
    const result = await serviceSupabase.from('users').upsert(payload, { onConflict: 'id' });
    if (!result.error || !isMissingColumnError(result.error)) {
      return result.error;
    }
  }

  return new Error('Failed to create user profile');
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

  let { data: dbUser, error: userError } = await loadUserRow(serviceSupabase, user.id);

  if (!dbUser && isMissingUserRow(userError)) {
    // Recover only when profile row is actually missing; never overwrite existing paid users.
    const { error: createError } = await serviceSupabase.from('users').insert({
      id: user.id,
      email: user.email ?? '',
      subscription_type: 'free',
      generations_used: 0,
      generation_limit: DEFAULT_GENERATION_LIMIT,
    });

    if (!createError) {
      const reloaded = await loadUserRow(serviceSupabase, user.id);

      dbUser = reloaded.data;
      userError = reloaded.error;
    } else if (isMissingColumnError(createError)) {
      const fallbackError = await createDefaultUserRow(serviceSupabase, user.id, user.email ?? '');
      if (!fallbackError) {
        const reloaded = await loadUserRow(serviceSupabase, user.id);
        dbUser = reloaded.data;
        userError = reloaded.error;
      }
    }
  }

  if (userError || !dbUser) {
    // Recover from manually deleted user profile rows by recreating defaults server-side.
    const createError = await createDefaultUserRow(serviceSupabase, user.id, user.email ?? '');

    if (!createError) {
      const reloaded = await loadUserRow(serviceSupabase, user.id);

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
  const used = dbUser.generations_used ?? dbUser.downloads_used ?? 0;
  const limit = dbUser.generation_limit ?? DEFAULT_GENERATION_LIMIT;

  const hasActiveSubscription =
    dbUser.subscription_type === 'paid' &&
    dbUser.subscription_expires_at &&
    new Date(dbUser.subscription_expires_at) > new Date();

  if (hasActiveSubscription) return false;

  return used >= limit;
}

export async function incrementGenerationUsage(serviceSupabase: SupabaseClient, userId: string, currentUsed: number) {
  const modernUpdate = await serviceSupabase
    .from('users')
    .update({ generations_used: currentUsed + 1 })
    .eq('id', userId);

  if (!modernUpdate.error || !isMissingColumnError(modernUpdate.error)) {
    return;
  }

  // Legacy fallback: if generations_used column isn't present yet, keep behavior via downloads_used.
  await serviceSupabase
    .from('users')
    .update({ downloads_used: currentUsed + 1 })
    .eq('id', userId);
}
