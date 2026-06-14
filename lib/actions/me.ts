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
