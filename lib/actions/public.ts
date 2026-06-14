"use server";

import { createClient } from "@/lib/supabase/server";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/** التقاط طلب تواصل (Lead) من زائر. */
export async function submitLead(input: {
  professionalId: string;
  channel: "whatsapp" | "call" | "email" | "form";
  source?: "profile" | "article" | "search" | "other";
  sourceArticleId?: string | null;
  visitorName?: string;
  visitorContact?: string;
  message?: string;
}): Promise<ActionResult> {
  if (!input.professionalId) return { ok: false, error: "بيانات ناقصة" };
  const supabase = await createClient();
  const { error } = await supabase.from("communication_requests").insert({
    professional_id: input.professionalId,
    channel: input.channel,
    source: input.source ?? "profile",
    source_article_id: input.sourceArticleId ?? null,
    visitor_name: input.visitorName ?? null,
    visitor_contact: input.visitorContact ?? null,
    message: input.message ?? null,
  });
  if (error) return { ok: false, error: "تعذّر إرسال الطلب، حاول لاحقًا." };
  return { ok: true };
}

/** تسجيل نقرة تواصل (لإحصاءات المهنيّ). */
export async function logContactClick(
  professionalId: string,
  channel: string
): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("log_event", {
    p_entity_type: "contact",
    p_entity_id: professionalId,
    p_event: "contact_click",
    p_channel: channel,
  });
}

/** إرسال سؤال «اسأل مختصًّا» (يدخل بحالة pending للإشراف). */
export async function submitQuestion(input: {
  specialtyId?: string | null;
  title: string;
  body: string;
  askerName?: string;
  askerContact?: string;
}): Promise<ActionResult> {
  const title = input.title?.trim();
  const body = input.body?.trim();
  if (!title || title.length < 5) return { ok: false, error: "العنوان قصير جدًّا." };
  if (!body || body.length < 10) return { ok: false, error: "نصّ السؤال قصير جدًّا." };

  const supabase = await createClient();
  const { error } = await supabase.from("questions").insert({
    specialty_id: input.specialtyId ?? null,
    title,
    body,
    asker_name: input.askerName ?? null,
    asker_contact: input.askerContact ?? null,
  });
  if (error) return { ok: false, error: "تعذّر إرسال السؤال، حاول لاحقًا." };
  return { ok: true };
}
