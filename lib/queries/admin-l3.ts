import { supabaseAdmin } from "@/lib/supabase/admin";

// ============================================================
// الطبقة 3 — الأنظمة النظيفة وتسلسلها (l3_instruments + v_l3_timeline)
// ============================================================

export const L3_KIND_LABEL: Record<string, string> = {
  issued: "صدور",
  amended: "تعديل",
  executive: "لائحة تنفيذية",
  repealed: "إلغاء",
  mention: "ذكر",
};

export type L3InstrumentRow = {
  id: string;
  canonical_name: string;
  domain: string | null;
  is_commercial: boolean;
  event_count: number;
  full_text_status: string;
  is_repealed: boolean;
};

export type L3TimelineEvent = {
  event_id: string;
  link_kind: string;
  event_type: string;
  decision_number: string | null;
  event_date: string | null;
  event_sort: number | null;
  gazette_issue: string | null;
  gazette_date: string | null;
  affected_articles: string | null;
  summary: string | null;
  refined: boolean | null;
  is_real: boolean | null;
  authority: string | null;
  text_excerpt: string;
};

export type L3InstrumentDetail = {
  id: string;
  canonical_name: string;
  domain: string | null;
  is_commercial: boolean;
  full_text_status: string;
  is_repealed: boolean;
  articles: L3Article[];
  events: L3TimelineEvent[];
};

export type L3Article = {
  article_number: string;
  article_text: string | null;
  status: string;
  amended_by_event_id: string | null;
};

// قائمة الأنظمة — مرتّبة بعدد الأحداث
export async function listL3Instruments(): Promise<L3InstrumentRow[]> {
  const { data } = await supabaseAdmin
    .from("l3_instruments")
    .select("id, canonical_name, domain, is_commercial, event_count, full_text_status, is_repealed")
    .gt("event_count", 0)
    .order("event_count", { ascending: false });
  return (data ?? []) as L3InstrumentRow[];
}

export async function getL3Counts() {
  const [{ count: instruments }, { count: links }] = await Promise.all([
    supabaseAdmin.from("l3_instruments").select("*", { count: "exact", head: true }).gt("event_count", 0),
    supabaseAdmin.from("l3_event_links").select("*", { count: "exact", head: true }),
  ]);
  return { instruments: instruments ?? 0, links: links ?? 0 };
}

// تفاصيل نظام — تسلسله الزمنيّ المصفّى + مواده (إن وُجدت)
export async function getL3InstrumentDetail(id: string): Promise<L3InstrumentDetail | null> {
  const { data: inst } = await supabaseAdmin
    .from("l3_instruments")
    .select("id, canonical_name, domain, is_commercial, full_text_status, is_repealed")
    .eq("id", id)
    .single();
  if (!inst) return null;

  const { data: events } = await supabaseAdmin
    .from("v_l3_timeline")
    .select("*")
    .eq("instrument_id", id)
    .order("event_sort", { ascending: true, nullsFirst: false });

  const { data: articles } = await supabaseAdmin
    .from("l3_articles")
    .select("article_number, article_text, status, amended_by_event_id")
    .eq("l3_instrument_id", id)
    .order("sort_order", { ascending: true });

  return {
    ...(inst as Omit<L3InstrumentDetail, "articles" | "events">),
    articles: (articles ?? []) as L3Article[],
    events: (events ?? []) as L3TimelineEvent[],
  };
}
