// Updated code in PaymentModal.tsx
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;