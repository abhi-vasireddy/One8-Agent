import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Admin client (service role — bypasses RLS)
export const supabaseAdmin = createClient(
  env.supabase.url,
  env.supabase.serviceRoleKey,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Ephemeral client for verifying user credentials without tainting the admin client's service role headers
export const verifyCredentials = async (email, password) => {
  const authClient = createClient(env.supabase.url, env.supabase.anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return authClient.auth.signInWithPassword({ email, password });
};

// Creates a client scoped to a user's JWT (respects RLS)
export const createUserClient = (accessToken) => {
  return createClient(env.supabase.url, env.supabase.anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
};
