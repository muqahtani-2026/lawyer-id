"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

interface Res {
  ok: boolean;
  error?: string;
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

/** نشر مسوّدة معتمدة كمقال (يدخل بحالة بانتظار الإشراف). */
export async function publishDraftAsArticle(draftId: string): Promise<Res> {
  const { supabase, userId } = await requireUser();
  if (!userId) return { ok: false, error: "غير مصرّح" };
  const { error } = await supabase.rpc("publish_article_from_draft", { p_draft_id: draftId });
  if (error) return { ok: false, error: "تعذّر النشر." };
  revalidatePath("/my-articles");
  return { ok: true };
}

/** تغيير حالة مقال يملكه المهنيّ (مثل إلغاء النشر). */
export async function setArticleStatus(
  articleId: string,
  status: "unpublished" | "draft"
): Promise<Res> {
  const { supabase, userId } = await requireUser();
  if (!userId) return { ok: false, error: "غير مصرّح" };
  const { error } = await supabase
    .from("articles")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", articleId)
    .eq("professional_id", userId);
  if (error) return { ok: false, error: "تعذّر التحديث." };
  revalidatePath("/my-articles");
  return { ok: true };
}

/** تحديث حالة طلب تواصل. */
export async function updateLeadStatus(
  leadId: string,
  status: "new" | "seen" | "handled"
): Promise<Res> {
  const { supabase, userId } = await requireUser();
  if (!userId) return { ok: false, error: "غير مصرّح" };
  const { error } = await supabase
    .from("communication_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", leadId)
    .eq("professional_id", userId);
  if (error) return { ok: false, error: "تعذّر التحديث." };
  revalidatePath("/leads");
  return { ok: true };
}

/** إرسال ردّ على سؤال (يدخل بحالة submitted للإشراف). */
export async function submitAnswer(questionId: string, body: string): Promise<Res> {
  const { supabase, userId } = await requireUser();
  if (!userId) return { ok: false, error: "غير مصرّح" };
  const text = body?.trim();
  if (!text || text.length < 10) return { ok: false, error: "الردّ قصير جدًّا." };
  const { error } = await supabase.from("answers").insert({
    question_id: questionId,
    professional_id: userId,
    body: text,
  });
  if (error) return { ok: false, error: "تعذّر إرسال الردّ." };
  revalidatePath("/inbox");
  return { ok: true };
}

function genSlug(name: string): string {
  const base = (name || "مهني")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[/\\?#[\]@!$&()*+,;="'.]/g, "")
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || "مهني"}-${suffix}`;
}

/** حفظ الملف العام (الهويّة العامّة + النبذة + قنوات التواصل + الإظهار). */
export async function savePublicProfile(input: {
  headline?: string;
  city?: string;
  bio_long?: string;
  contact_whatsapp?: string;
  contact_phone?: string;
  contact_email?: string;
  contact_form_enabled?: boolean;
  is_public?: boolean;
}): Promise<Res> {
  const { supabase, userId } = await requireUser();
  if (!userId) return { ok: false, error: "غير مصرّح" };

  // الملف الحاليّ (لتوليد slug عند أوّل إظهار)
  const { data: cur } = await supabase
    .from("profiles")
    .select("slug, full_name")
    .eq("id", userId)
    .maybeSingle();

  const update: Record<string, unknown> = {
    headline: input.headline ?? null,
    city: input.city ?? null,
    contact_whatsapp: input.contact_whatsapp ?? null,
    contact_phone: input.contact_phone ?? null,
    contact_email: input.contact_email ?? null,
    contact_form_enabled: input.contact_form_enabled ?? true,
    is_public: input.is_public ?? false,
    updated_at: new Date().toISOString(),
  };

  if (input.is_public && !cur?.slug) {
    update.slug = genSlug(cur?.full_name ?? "");
  }

  const { error: e1 } = await supabase.from("profiles").update(update).eq("id", userId);
  if (e1) return { ok: false, error: "تعذّر حفظ الملف." };

  const { error: e2 } = await supabase
    .from("lawyer_profiles")
    .update({ bio_long: input.bio_long ?? null, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (e2) return { ok: false, error: "تعذّر حفظ النبذة." };

  revalidatePath("/public-profile");
  return { ok: true };
}

/** نشر مسوّدة كمقال مع تعديلات المحامي (ينشئ/يحدّث مقالًا بحالة pending). */
export async function publishDraftWithEdits(input: {
  draftId: string;
  title: string;
  excerpt: string;
  body: string;
}): Promise<Res> {
  const { supabase, userId } = await requireUser();
  if (!userId) return { ok: false, error: "غير مصرّح" };
  const title = input.title?.trim();
  const body = input.body?.trim();
  if (!title || title.length < 4) return { ok: false, error: "العنوان قصير جدًّا." };
  if (!body || body.length < 20) return { ok: false, error: "المحتوى قصير جدًّا." };

  const { data: draft } = await supabase
    .from("content_drafts")
    .select("id, specialty_id")
    .eq("id", input.draftId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!draft) return { ok: false, error: "المسوّدة غير موجودة." };

  // مقال موجود لهذه المسوّدة؟
  const { data: existing } = await supabase
    .from("articles")
    .select("id")
    .eq("source_draft_id", input.draftId)
    .eq("professional_id", userId)
    .maybeSingle();

  const now = new Date().toISOString();
  if (existing) {
    const { error } = await supabase
      .from("articles")
      .update({ title, excerpt: input.excerpt?.trim() || null, body, status: "pending", updated_at: now })
      .eq("id", existing.id)
      .eq("professional_id", userId);
    if (error) return { ok: false, error: "تعذّر الحفظ." };
  } else {
    const { error } = await supabase.from("articles").insert({
      professional_id: userId,
      source_draft_id: input.draftId,
      specialty_id: draft.specialty_id ?? null,
      slug: genSlug(title),
      title,
      excerpt: input.excerpt?.trim() || null,
      body,
      status: "pending",
    });
    if (error) return { ok: false, error: "تعذّر النشر (قد يكون العنوان مكرّرًا)." };
  }
  revalidatePath("/my-articles");
  return { ok: true };
}

/** تحرير مقال قائم يملكه المحامي. */
export async function updateMyArticle(input: {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  seo_title?: string;
  seo_description?: string;
}): Promise<Res> {
  const { supabase, userId } = await requireUser();
  if (!userId) return { ok: false, error: "غير مصرّح" };
  const title = input.title?.trim();
  const body = input.body?.trim();
  if (!title || title.length < 4) return { ok: false, error: "العنوان قصير جدًّا." };
  if (!body || body.length < 20) return { ok: false, error: "المحتوى قصير جدًّا." };

  const { error } = await supabase
    .from("articles")
    .update({
      title,
      excerpt: input.excerpt?.trim() || null,
      body,
      seo_title: input.seo_title?.trim() || null,
      seo_description: input.seo_description?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .eq("professional_id", userId);
  if (error) return { ok: false, error: "تعذّر الحفظ." };
  revalidatePath("/my-articles");
  return { ok: true };
}

export async function saveNotificationPrefs(input: {
  email_enabled: boolean;
  notify_on_lead: boolean;
  notify_on_question: boolean;
  weekly_digest: boolean;
  preferred_send_hour: number;
}): Promise<Res> {
  const { supabase, userId } = await requireUser();
  if (!userId) return { ok: false, error: "غير مصرّح" };
  const { data: existing } = await supabase
    .from("notification_preferences").select("user_id").eq("user_id", userId).maybeSingle();
  const payload = {
    email_enabled: input.email_enabled,
    notify_on_lead: input.notify_on_lead,
    notify_on_question: input.notify_on_question,
    weekly_digest: input.weekly_digest,
    preferred_send_hour: input.preferred_send_hour,
    updated_at: new Date().toISOString(),
  };
  const { error } = existing
    ? await supabase.from("notification_preferences").update(payload).eq("user_id", userId)
    : await supabase.from("notification_preferences").insert({ user_id: userId, ...payload });
  if (error) return { ok: false, error: "تعذّر الحفظ." };
  revalidatePath("/settings");
  return { ok: true };
}

/** استوديو المحتوى: طلب توليد مسوّدة عند الطلب عبر مولّد n8n (نفس عقد الإنتاج في billing). */
export async function requestStudioGeneration(input: {
  legalSourceId: string;
  contentFormat: string;
  tone: string;
}): Promise<{ ok: boolean; queued?: boolean; error?: string }> {
  const { supabase, userId } = await requireUser();
  if (!userId) return { ok: false, error: "غير مصرّح" };

  // لا توليد قبل اعتماد الحساب
  const { data: prof } = await supabase
    .from("profiles")
    .select("approval_status")
    .eq("id", userId)
    .maybeSingle();
  if ((prof?.approval_status ?? "approved") !== "approved") {
    return { ok: false, error: "حسابك بانتظار الاعتماد — لا يمكن توليد المحتوى قبل الموافقة." };
  }

  const hook = process.env.N8N_GENERATE_WEBHOOK_URL;
  if (!hook) {
    return { ok: false, error: "مولّد المحتوى غير موصول بعد. تواصل مع الإدارة لربط n8n." };
  }
  try {
    const res = await fetch(hook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.N8N_WEBHOOK_SECRET ? { "x-webhook-secret": process.env.N8N_WEBHOOK_SECRET } : {}),
      },
      body: JSON.stringify({
        user_id: userId,
        count: 1,
        reason: "studio",
        legal_source_id: input.legalSourceId || null,
        content_format: input.contentFormat || null,
        tone: input.tone || null,
      }),
    });
    if (!res.ok) return { ok: false, error: "تعذّر إرسال الطلب للمولّد." };
    return { ok: true, queued: true };
  } catch {
    return { ok: false, error: "تعذّر الاتصال بالمولّد." };
  }
}
