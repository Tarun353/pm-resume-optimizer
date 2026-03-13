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

  // PostgREST can surface missing columns via either SQLSTATE 42703 or PGRST schema cache errors.
  return maybeCode === '42703' || maybeCode === 'PGRST204' || maybeMessage.toLowerCase().includes('column');
}

async function loadUserForQuota(serviceSupabase: SupabaseClient, userId: string): Promise<{ dbUser: DbUser | null; userError: unknown }> {
  const modern = await serviceSupabase
    .from('users')
    .select('id,downloads_used,generations_used,generation_limit,subscription_type,subscription_expires_at')
    .eq('id', userId)
    .single();

  if (!modern.error || !isMissingColumnError(modern.error)) {
    return { dbUser: modern.data, userError: modern.error };
  }

  // Backward compatibility: production DB may not yet have generation columns.
  const legacy = await serviceSupabase
    .from('users')
    .select('id,downloads_used,subscription_type,subscription_expires_at')
    .eq('id', userId)
    .single();

  if (legacy.error || !legacy.data) {
    return { dbUser: null, userError: legacy.error };
  }

  return {
    dbUser: {
      id: legacy.data.id,
      downloads_used: legacy.data.downloads_used,
      subscription_type: legacy.data.subscription_type,
      subscription_expires_at: legacy.data.subscription_expires_at,
      // Fallback mapping until DB has dedicated generation columns.
      generations_used: legacy.data.downloads_used ?? 0,
      generation_limit: 5,
    },
    userError: null,
  };
}

async function recreateMissingUserRow(serviceSupabase: SupabaseClient, userId: string, email: string): Promise<void> {
  // Try modern schema first.
  const modernInsert = await serviceSupabase.from('users').insert({
    id: userId,
    email,
    subscription_type: 'free',
    downloads_used: 0,
    generations_used: 0,
    generation_limit: 5,
  });

  if (!modernInsert.error || !isMissingColumnError(modernInsert.error)) {
    return;
  }

  // Fallback for legacy schema without generation columns.
  await serviceSupabase.from('users').insert({
    id: userId,
    email,
    subscription_type: 'free',
    downloads_used: 0,
  });
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

  let { dbUser, userError } = await loadUserForQuota(serviceSupabase, user.id);

  if (!dbUser && isMissingUserRow(userError)) {
    await recreateMissingUserRow(serviceSupabase, user.id, user.email ?? '');
    const reloaded = await loadUserForQuota(serviceSupabase, user.id);
    dbUser = reloaded.dbUser;
    userError = reloaded.userError;
  }

  if (userError || !dbUser) {
    throw new Error('USER_NOT_FOUND');
  }

  return { userId: user.id, dbUser, serviceSupabase };
}

export function hasExceededGenerationQuota(dbUser: DbUser): boolean {
  const used = dbUser.generations_used ?? dbUser.downloads_used ?? 0;
  const limit = dbUser.generation_limit ?? 5;

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

  const columnMissing =
    modernUpdate.error &&
    typeof modernUpdate.error === 'object' &&
    (('code' in modernUpdate.error &&
      (modernUpdate.error.code === '42703' || modernUpdate.error.code === 'PGRST204')) ||
      ('message' in modernUpdate.error &&
        typeof modernUpdate.error.message === 'string' &&
        modernUpdate.error.message.toLowerCase().includes('column')));

  if (!modernUpdate.error || !columnMissing) {
    return;
  }

  // Legacy fallback: if generations_used column isn't present yet, keep behavior via downloads_used.
  await serviceSupabase
    .from('users')
    .update({ downloads_used: currentUsed + 1 })
    .eq('id', userId);
}
