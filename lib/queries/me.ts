import { createClient } from "@/lib/supabase/server";

async function uid() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

export async function getMyStats() {
  const { supabase } = await uid();
  const { data } = await supabase.rpc("get_my_dashboard");
  return (data as Record<string, number>) ?? {};
}

export async function getMyArticles() {
  const { supabase, userId } = await uid();
  if (!userId) return [];
  const { data } = await supabase
    .from("articles")
    .select("id, slug, title, excerpt, status, views_count, published_at, source_draft_id, updated_at")
    .eq("professional_id", userId)
    .order("updated_at", { ascending: false });
  return data ?? [];
}

export async function getMyLeads() {
  const { supabase, userId } = await uid();
  if (!userId) return [];
  const { data } = await supabase
    .from("communication_requests")
    .select("id, source, channel, visitor_name, visitor_contact, message, status, created_at")
    .eq("professional_id", userId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getMyInbox() {
  const { supabase, userId } = await uid();
  if (!userId) return { questions: [], myAnswers: {} as Record<string, string> };

  const { data: specs } = await supabase
    .from("user_specialties")
    .select("specialty_id")
    .eq("user_id", userId);
  const specialtyIds = (specs ?? []).map((s) => s.specialty_id).filter(Boolean);

  let questions: Array<Record<string, unknown>> = [];
  if (specialtyIds.length > 0) {
    const { data } = await supabase
      .from("questions")
      .select("id, title, body, specialty_id, status, created_at")
      .in("specialty_id", specialtyIds)
      .in("status", ["approved", "answered"])
      .order("created_at", { ascending: false });
    questions = data ?? [];
  }

  const { data: ans } = await supabase
    .from("answers")
    .select("question_id, body, status")
    .eq("professional_id", userId);
  const myAnswers: Record<string, string> = {};
  (ans ?? []).forEach((a) => {
    myAnswers[a.question_id as string] = a.status as string;
  });

  return { questions, myAnswers };
}

export interface MyPublicProfile {
  slug: string | null;
  full_name: string | null;
  headline: string | null;
  city: string | null;
  contact_whatsapp: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_form_enabled: boolean | null;
  is_public: boolean | null;
  bio_long: string | null;
}

export async function getMyPublicProfile(): Promise<MyPublicProfile | null> {
  const { supabase, userId } = await uid();
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "slug, full_name, headline, city, contact_whatsapp, contact_phone, contact_email, contact_form_enabled, is_public"
    )
    .eq("id", userId)
    .maybeSingle();

  const { data: lp } = await supabase
    .from("lawyer_profiles")
    .select("bio_long")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile) return null;
  return { ...(profile as Omit<MyPublicProfile, "bio_long">), bio_long: lp?.bio_long ?? null };
}

/** المسوّدات المعتمدة الجاهزة للنشر كمقال (لم تُنشر بعد). */
export async function getPublishableDrafts() {
  const { supabase, userId } = await uid();
  if (!userId) return [];
  const { data: published } = await supabase
    .from("articles")
    .select("source_draft_id")
    .eq("professional_id", userId);
  const publishedDraftIds = new Set((published ?? []).map((a) => a.source_draft_id).filter(Boolean));

  const { data: drafts } = await supabase
    .from("content_drafts")
    .select("id, draft_title, draft_summary, content_format, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  return (drafts ?? []).filter((d) => !publishedDraftIds.has(d.id));
}
