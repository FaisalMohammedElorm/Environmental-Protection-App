import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

// Service-role client for server-side use only (Storage uploads/signed URLs).
// Never send this key to the frontend.
export const supabaseAdmin = createClient(env.supabase.url, env.supabase.serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});
