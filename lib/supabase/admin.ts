import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL env var");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY env var");
}

/**
 * Admin Supabase client.
 *
 * - Uses the Service Role key, which BYPASSES Row Level Security.
 * - ONLY use this in server-side code: Route Handlers, Server Actions,
 *   server-side data fetchers. NEVER in a client component.
 * - This module imports `process.env.SUPABASE_SERVICE_ROLE_KEY` directly,
 *   so importing it from a client component would fail at build time
 *   (Next.js refuses to bundle non-NEXT_PUBLIC env vars for the browser).
 */
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});