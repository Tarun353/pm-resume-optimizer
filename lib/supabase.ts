import { createClient } from '@supabase/supabase-js';

// Use fallback values during build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client with service role (for admin operations)
export function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !serviceRoleKey) {
    throw new Error('Supabase credentials not configured');
  }
  
  return createClient(url, serviceRoleKey);
}

// Types
export interface User {
  id: string;
  email: string;
  created_at: string;
  subscription_type: 'free' | 'paid';
  subscription_expires_at: string | null;
  downloads_used: number;
}

export interface Download {
  id: string;
  user_id: string;
  type: 'resume' | 'coverletter';
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  plan_type: '1day' | '10days' | '1month';
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}
