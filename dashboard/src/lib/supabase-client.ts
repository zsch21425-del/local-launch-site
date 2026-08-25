import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase-config";

// Browser/App client — RLS-scoped, read/write on profiles via auth.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Server/Agent client — Service Role for autonomous agent writes.
export function serviceClient(serviceRole: string) {
  return createClient(SUPABASE_URL, serviceRole, { auth: { autoRefreshToken: false } });
}
