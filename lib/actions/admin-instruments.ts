"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

interface Res {
  ok: boolean;
  error?: string;
}

/** يتحقّق أنّ المستخدم الحاليّ مشرف قبل أيّ عمليّة بصلاحيّة الخدمة. */
async function requireAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  return !!data?.is_admin;
}

/**
 * تأكيد ربط حدث بنظامه الأمّ يدويًّا (للحالات الغامضة).
 * يضبط link_status='confirmed' ويربط instrument_id.
 */
export async function confirmEventLink(eventId: string, instrumentId: string): Promise<Res> {
  if (!(await requireAdmin())) return { ok: false, error: "غير مصرّح" };
  if (!eventId || !instrumentId) return { ok: false, error: "بيانات ناقصة" };

  const { error } = await supabaseAdmin
    .from("legal_events")
    .update({ instrument_id: instrumentId, link_status: "confirmed", updated_at: new Date().toISOString() })
    .eq("id", eventId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/instruments");
  revalidatePath(`/admin/instruments/${instrumentId}`);
  return { ok: true };
}

/**
 * فكّ ربط حدث (إن رُبط خطأً) — يعيده إلى حالة غير مربوط.
 */
export async function unlinkEvent(eventId: string): Promise<Res> {
  if (!(await requireAdmin())) return { ok: false, error: "غير مصرّح" };
  if (!eventId) return { ok: false, error: "بيانات ناقصة" };

  const { error } = await supabaseAdmin
    .from("legal_events")
    .update({ instrument_id: null, link_status: "unlinked", updated_at: new Date().toISOString() })
    .eq("id", eventId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/instruments");
  return { ok: true };
}

/**
 * تحديث حالة النظام الأمّ (نافذ / مُعدّل / مُلغى …).
 */
export async function setInstrumentStatus(instrumentId: string, status: string): Promise<Res> {
  if (!(await requireAdmin())) return { ok: false, error: "غير مصرّح" };
  const allowed = ["in_force", "amended", "repealed", "superseded", "unknown"];
  if (!allowed.includes(status)) return { ok: false, error: "حالة غير صالحة" };

  const { error } = await supabaseAdmin
    .from("legal_instruments")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", instrumentId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/instruments/${instrumentId}`);
  return { ok: true };
}
