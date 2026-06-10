"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * إجراءات جدولة النشر على X (ميزة Pro).
 * - scheduleDraft: يضبط scheduled_for لمسوّدة x_short مقبولة غير منشورة.
 * - unscheduleDraft: يمسح الجدولة.
 * RLS تضمن أنّ المحامي لا يعدّل إلا مسوّداته.
 */

export type ScheduleResult = { ok: true } | { ok: false; error: string };

export async function scheduleDraft(
  draftId: string,
  isoUtc: string,
): Promise<ScheduleResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "غير مسجَّل الدخول." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single();
  if (profile?.tier !== "pro") {
    return { ok: false, error: "الجدولة متاحة لطبقة Pro فقط." };
  }

  // تحقّق من الوقت
  const when = new Date(isoUtc);
  if (isNaN(when.getTime())) return { ok: false, error: "وقت غير صالح." };
  if (when.getTime() < Date.now() + 60 * 1000) {
    return { ok: false, error: "اختر وقتًا مستقبليًّا (بعد دقيقة على الأقلّ)." };
  }

  // تحقّق من صلاحيّة المسوّدة للجدولة
  const { data: draft } = await supabase
    .from("content_drafts")
    .select("content_format, status, published_at")
    .eq("id", draftId)
    .single();
  if (!draft) return { ok: false, error: "تعذّر العثور على المسوّدة." };
  if (draft.published_at) return { ok: false, error: "المسوّدة منشورة مسبقًا." };
  if (draft.status !== "approved") {
    return { ok: false, error: "وافق على المسوّدة أوّلًا ثمّ جدولها." };
  }
  if (draft.content_format !== "x_short") {
    return { ok: false, error: "الجدولة متاحة لمسوّدات X القصيرة (x_short) فقط." };
  }

  const { error } = await supabase
    .from("content_drafts")
    .update({ scheduled_for: when.toISOString() })
    .eq("id", draftId);

  if (error) return { ok: false, error: "تعذّر حفظ الجدولة." };
  return { ok: true };
}

export async function unscheduleDraft(draftId: string): Promise<ScheduleResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "غير مسجَّل الدخول." };

  const { error } = await supabase
    .from("content_drafts")
    .update({ scheduled_for: null })
    .eq("id", draftId);

  if (error) return { ok: false, error: "تعذّر إلغاء الجدولة." };
  return { ok: true };
}
