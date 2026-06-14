import { createClient } from "@/lib/supabase/server";

/** نوع المهنيّ العامّ كما يعيده v_public_professionals */
export interface PublicProfessional {
  id: string;
  slug: string | null;
  full_name: string | null;
  avatar_url: string | null;
  tier: string | null;
  headline: string | null;
  city: string | null;
  languages: string[] | null;
  contact_whatsapp: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_form_enabled: boolean | null;
  bio_long: string | null;
  years_experience: number | null;
  specialization: string | null;
  specialties: { id: string; name: string; slug: string; is_primary: boolean }[];
  article_count: number;
}

export interface PublicArticleListItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  specialty_name: string | null;
  professional_id: string;
  professional_name: string | null;
  professional_slug: string | null;
  published_at: string | null;
}

export interface PublicField {
  id: string;
  name_ar: string;
  name_en: string | null;
  slug: string;
  description: string | null;
}

/* ----------------------------- المهنيّون ----------------------------- */

export async function getFeaturedProfessionals(limit = 6): Promise<PublicProfessional[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_public_professionals")
    .select("*")
    .order("article_count", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as PublicProfessional[];
}

export async function getProfessionalBySlug(slug: string): Promise<PublicProfessional | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_public_professionals")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return data as PublicProfessional;
}

export async function searchProfessionals(
  q?: string,
  city?: string,
  specialtySlug?: string
): Promise<PublicProfessional[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_professionals", {
    q: q ?? null,
    p_city: city ?? null,
    p_specialty_slug: specialtySlug ?? null,
  });
  if (error || !data) return [];
  return data as PublicProfessional[];
}

/* ------------------------------ المقالات ------------------------------ */

export async function searchArticles(
  q?: string,
  specialtySlug?: string
): Promise<PublicArticleListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_articles", {
    q: q ?? null,
    p_specialty_slug: specialtySlug ?? null,
  });
  if (error || !data) return [];
  return data as PublicArticleListItem[];
}

export async function getPublishedArticles(limit = 12): Promise<PublicArticleListItem[]> {
  const all = await searchArticles();
  return all.slice(0, limit);
}

export async function getArticleBySlug(slug: string) {
  const supabase = await createClient();
  const { data: article, error } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error || !article) return null;

  const author = await (async () => {
    const { data } = await supabase
      .from("v_public_professionals")
      .select("*")
      .eq("id", article.professional_id)
      .maybeSingle();
    return (data as PublicProfessional) ?? null;
  })();

  return { article, author };
}

/** تسجيل حدث (مشاهدة/نقرة) عبر دالّة log_event الآمنة. */
export async function logEvent(
  entityType: "profile" | "article" | "contact",
  entityId: string,
  event: "view" | "contact_click",
  channel?: string
) {
  const supabase = await createClient();
  await supabase.rpc("log_event", {
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_event: event,
    p_channel: channel ?? null,
  });
}

/* ----------------------------- اسأل مختصًّا ---------------------------- */

export async function getPublishedQuestions(limit = 20) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("questions")
    .select("id, title, body, specialty_id, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data;
}

export async function getQuestionWithAnswers(id: string) {
  const supabase = await createClient();
  const { data: question } = await supabase
    .from("questions")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  if (!question) return null;

  const { data: answers } = await supabase
    .from("answers")
    .select("id, body, professional_id, published_at")
    .eq("question_id", id)
    .eq("status", "published")
    .order("published_at", { ascending: true });

  return { question, answers: answers ?? [] };
}

/* ------------------------------ المجالات ------------------------------ */

export async function getActiveFields(): Promise<PublicField[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("specialties")
    .select("id, name_ar, name_en, slug, description")
    .eq("is_active", true)
    .order("name_ar", { ascending: true });
  if (error || !data) return [];
  return data as PublicField[];
}

export async function getFieldBySlug(slug: string): Promise<PublicField | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("specialties")
    .select("id, name_ar, name_en, slug, description")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return data as PublicField;
}
