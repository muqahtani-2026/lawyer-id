import { createClient } from "@supabase/supabase-js";

/**
 * عميل Supabase بصلاحية service_role.
 *
 * ضروريّ لأنّ أعمدة access_token_enc / refresh_token_enc في
 * lawyer_x_credentials محجوبة عن دور authenticated (column-level GRANT)،
 * فلا يقرؤها/يكتبها إلا service_role.
 *
 * ⚠️ يُستخدَم على الخادم فقط (route handlers / server actions).
 *    لا تستورده في أيّ مكوّن client إطلاقًا — المفتاح سرّيّ.
 *
 * يتطلّب متغيّرات البيئة:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY   ← تأكّد من ضبطه في Vercel
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL أو SUPABASE_SERVICE_ROLE_KEY غير مضبوط.",
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
