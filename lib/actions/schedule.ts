"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * إجراءات جدولة النشر على X (ميزة Pro).
 * - scheduleDraft / unscheduleDraft: جدولة فرديّة من صفحة المسوّدة.
 * - bulkScheduleDrafts: جدولة دفعيّة لعدّة مسوّدات دفعة واحدة من صفحة /schedule.
 * RLS تضمن أنّ المحامي لا يعدّل إلا مسوّداته.
 *
 * القيود (Pro batch scheduling):
 *  - السقف 30 يومًا من الآن (يطابق CHECK في قاعدة البيانات).
 *  - لا وقتان متطابقان لنفس المحامي (يطابق uniq_drafts_user_scheduled_for).
 *  - الجدولة لمسوّدات x_short المقبولة غير المنشورة فقط.
 */

export type ScheduleResult = { ok: true } | { ok: false; error: string };

const MS_MIN = 60 * 1000;
const MAX_HORIZON_MS = 30 * 24 * 60 * 60 * 1000; // 30 يومًا

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
  if (when.getTime() < Date.now() + MS_MIN) {
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

/* ------------------------------------------------------------------ */
/* جدولة دفعيّة — تعتمد الجدول كاملًا دفعة واحدة من صفحة /schedule.     */
/* ------------------------------------------------------------------ */

export type BulkItem = { draftId: string; isoUtc: string };

export async function bulkScheduleDrafts(
  items: BulkItem[],
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

  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: "لا توجد مسوّدات للجدولة." };
  }

  const now = Date.now();

  // 1) تحقّق من كلّ وقت: صالح، مستقبليّ، وداخل 30 يومًا.
  const seen = new Set<number>();
  for (const it of items) {
    const t = new Date(it.isoUtc).getTime();
    if (isNaN(t)) return { ok: false, error: "أحد الأوقات غير صالح." };
    if (t < now + MS_MIN) {
      return { ok: false, error: "كلّ الأوقات يجب أن تكون مستقبليّة." };
    }
    if (t > now + MAX_HORIZON_MS) {
      return { ok: false, error: "لا يمكن الجدولة لأبعد من 30 يومًا." };
    }
    // 2) منع تكرار نفس الوقت داخل نفس الدفعة (دقّة الدقيقة).
    const minuteKey = Math.floor(t / MS_MIN);
    if (seen.has(minuteKey)) {
      return { ok: false, error: "لا يمكن جدولة مسوّدتين في نفس الوقت بالضبط. غيّر التوقيت." };
    }
    seen.add(minuteKey);
  }

  // 3) تأكّد أنّ كلّ المسوّدات تخصّ هذا المحامي، x_short، مقبولة، غير منشورة.
  const ids = items.map((i) => i.draftId);
  const { data: drafts, error: fetchErr } = await supabase
    .from("content_drafts")
    .select("id, content_format, status, published_at, user_id")
    .in("id", ids);
  if (fetchErr) return { ok: false, error: "تعذّر التحقّق من المسوّدات." };
  if (!drafts || drafts.length !== ids.length) {
    return { ok: false, error: "بعض المسوّدات غير موجودة." };
  }
  for (const d of drafts) {
    if (d.user_id !== user.id)
      return { ok: false, error: "لا تملك صلاحيّة على إحدى المسوّدات." };
    if (d.published_at)
      return { ok: false, error: "إحدى المسوّدات منشورة مسبقًا." };
    if (d.status !== "approved")
      return { ok: false, error: "كلّ المسوّدات يجب أن تكون مقبولة قبل الجدولة." };
    if (d.content_format !== "x_short")
      return { ok: false, error: "الجدولة متاحة لمسوّدات X القصيرة فقط." };
  }

  // 4) اكتب الجدولة صفًّا صفًّا (القيد الفريد في DB حارس نهائيّ ضدّ التضارب).
  for (const it of items) {
    const { error } = await supabase
      .from("content_drafts")
      .update({ scheduled_for: new Date(it.isoUtc).toISOString() })
      .eq("id", it.draftId)
      .eq("user_id", user.id);
    if (error) {
      // 23505 = unique_violation (وقت مكرّر مع صفّ موجود مسبقًا)
      if ((error as { code?: string }).code === "23505") {
        return { ok: false, error: "أحد الأوقات محجوز بمسوّدة أخرى. غيّر التوقيت." };
      }
      return { ok: false, error: "تعذّر حفظ الجدول كاملًا." };
    }
  }

  return { ok: true };
}
