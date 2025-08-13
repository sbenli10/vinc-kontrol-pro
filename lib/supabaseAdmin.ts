// lib/supabaseAdmin.ts
import { createClient } from "@supabase/supabase-js";
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,   // service role (server-only)
  { auth: { persistSession: false } }
);
