import { supabaseAdmin } from "@/lib/supabase/admin";

// ============================================================
// Types — طبقة الأنظمة وتسلسلها الزمنيّ (Legal Instruments + Timeline)
// ============================================================

export const KIND_LABEL: Record<string, string> = {
  system: "نظام",
  executive_regulation: "لائحة تنفيذية",
  rules: "قواعد",
  agreement: "اتفاقية",
  arrangement: "ترتيب تنظيميّ",
  royal_order: "أمر ملكيّ",
  other: "أخرى",
};

export const STATUS_LABEL: Record<string, string> = {
  in_force: "نافذ",
  amended: "مُعدّل",
  repealed: "مُلغى",
  superseded: "محلّ آخر",
  unknown: "غير محدّد",
};

export const EVENT_TYPE_LABEL: Record<string, string> = {
  issued: "صدور",
  amended: "تعديل",
  repealed: "إلغاء",
  executive_regulation: "لائحة تنفيذية",
  rules: "قواعد",
  correction: "تصحيح",
  royal_decree: "مرسوم ملكيّ",
  cabinet_decision: "قرار مجلس الوزراء",
  ministerial_decision: "قرار وزاريّ",
  other: "حدث",
};

export type InstrumentRow = {
  id: string;
  canonical_title: string;
  instrument_kind: string;
  specialty_id: string | null;
  specialty_name: string | null;
  first_reference_number: string | null;
  first_issue_date_hijri: string | null;
  status: string;
  event_count: number;
  latest_event_date_hijri: string | null;
  pending_link_count: number;
};

export type TimelineEvent = {
  id: string;
  event_type: string;
  instrument_number: string | null;
  authority: string | null;
  event_date_hijri: string | null;
  event_sort: number | null;
  title: string | null;
  affected_articles: string | null;
  raw_text: string; // النصّ الحرفيّ — لا يُعدَّل
  link_status: string;
  link_confidence: string | null;
  link_candidate_note: string | null;
  gazette_issue_number: string | null;
  gazette_date_hijri: string | null;
};

export type InstrumentDetail = {
  id: string;
  canonical_title: string;
  instrument_kind: string;
  specialty_id: string | null;
  specialty_name: string | null;
  first_reference_number: string | null;
  first_issue_date_hijri: string | null;
  status: string;
  summary: string | null;
  events: TimelineEvent[]; // مرتّبة الأقدم → الأحدث
};

export type InstrumentFilters = {
  search?: string;
  specialty_id?: string;
  instrument_kind?: string;
  status?: string;
};

export type InstrumentFilterOptions = {
  specialties: { id: string; name_ar: string }[];
  kinds: { value: string; label: string }[];
  statuses: { value: string; label: string }[];
};

// ============================================================
// listInstruments — قائمة الأنظمة مع التصنيف + عدد الأحداث + أحدثها
// ============================================================

export async function listInstruments(filters: InstrumentFilters = {}): Promise<InstrumentRow[]> {
  const a = supabaseAdmin;

  let q = a
    .from("legal_instruments")
    .select(
      "id, canonical_title, instrument_kind, specialty_id, first_reference_number, first_issue_date_hijri, status"
    );

  if (filters.specialty_id) q = q.eq("specialty_id", filters.specialty_id);
  if (filters.instrument_kind) q = q.eq("instrument_kind", filters.instrument_kind);
  if (filters.status) q = q.eq("status", filters.status);
  if (filters.search && filters.search.trim()) {
    const s = filters.search.trim();
    q = q.or(`canonical_title.ilike.%${s}%,first_reference_number.ilike.%${s}%`);
  }

  const { data: rows } = await q.order("first_issue_sort", { ascending: true, nullsFirst: false });
  if (!rows || rows.length === 0) return [];

  const ids = rows.map((r) => r.id as string);

  // أسماء التخصّصات
  const specIds = [...new Set(rows.map((r) => r.specialty_id as string).filter(Boolean))];
  const specMap = new Map<string, string>();
  if (specIds.length > 0) {
    const { data: specs } = await a.from("specialties").select("id, name_ar").in("id", specIds);
    (specs ?? []).forEach((s) => specMap.set(s.id as string, s.name_ar as string));
  }

  // أحداث كلّ نظام: العدّ + أحدث تاريخ + عدد المعلّق ربطه
  const { data: events } = await a
    .from("legal_events")
    .select("instrument_id, event_date_hijri, event_sort, link_status")
    .in("instrument_id", ids);

  const agg = new Map<string, { count: number; pending: number; latestSort: number; latestDate: string | null }>();
  (events ?? []).forEach((e) => {
    const key = e.instrument_id as string;
    if (!key) return;
    const cur = agg.get(key) ?? { count: 0, pending: 0, latestSort: -1, latestDate: null };
    cur.count += 1;
    if (e.link_status === "pending_link") cur.pending += 1;
    const sort = (e.event_sort as number) ?? -1;
    if (sort >= cur.latestSort) {
      cur.latestSort = sort;
      cur.latestDate = (e.event_date_hijri as string) ?? cur.latestDate;
    }
    agg.set(key, cur);
  });

  return rows.map((r) => {
    const g = agg.get(r.id as string);
    return {
      id: r.id as string,
      canonical_title: r.canonical_title as string,
      instrument_kind: r.instrument_kind as string,
      specialty_id: (r.specialty_id as string) ?? null,
      specialty_name: r.specialty_id ? specMap.get(r.specialty_id as string) ?? null : null,
      first_reference_number: (r.first_reference_number as string) ?? null,
      first_issue_date_hijri: (r.first_issue_date_hijri as string) ?? null,
      status: r.status as string,
      event_count: g?.count ?? 0,
      latest_event_date_hijri: g?.latestDate ?? null,
      pending_link_count: g?.pending ?? 0,
    };
  });
}

// ============================================================
// getInstrumentDetail — نظام واحد + تسلسله الزمنيّ (الأقدم → الأحدث)
// ============================================================

export async function getInstrumentDetail(id: string): Promise<InstrumentDetail | null> {
  const a = supabaseAdmin;

  const { data: inst } = await a
    .from("legal_instruments")
    .select(
      "id, canonical_title, instrument_kind, specialty_id, first_reference_number, first_issue_date_hijri, status, summary"
    )
    .eq("id", id)
    .maybeSingle();

  if (!inst) return null;

  let specialty_name: string | null = null;
  if (inst.specialty_id) {
    const { data: sp } = await a
      .from("specialties")
      .select("name_ar")
      .eq("id", inst.specialty_id as string)
      .maybeSingle();
    specialty_name = (sp?.name_ar as string) ?? null;
  }

  const { data: events } = await a
    .from("legal_events")
    .select(
      "id, event_type, instrument_number, authority, event_date_hijri, event_sort, title, affected_articles, raw_text, link_status, link_confidence, link_candidate_note, gazette_issue_id"
    )
    .eq("instrument_id", id)
    .order("event_sort", { ascending: true, nullsFirst: true }); // الأقدم أولًا

  // أرقام أعداد أم القرى لكلّ حدث
  const gIds = [...new Set((events ?? []).map((e) => e.gazette_issue_id as string).filter(Boolean))];
  const gMap = new Map<string, { num: string; date: string | null }>();
  if (gIds.length > 0) {
    const { data: gz } = await a
      .from("gazette_issues")
      .select("id, issue_number, issue_date_hijri")
      .in("id", gIds);
    (gz ?? []).forEach((g) =>
      gMap.set(g.id as string, { num: g.issue_number as string, date: (g.issue_date_hijri as string) ?? null })
    );
  }

  const timeline: TimelineEvent[] = (events ?? []).map((e) => {
    const g = e.gazette_issue_id ? gMap.get(e.gazette_issue_id as string) : null;
    return {
      id: e.id as string,
      event_type: e.event_type as string,
      instrument_number: (e.instrument_number as string) ?? null,
      authority: (e.authority as string) ?? null,
      event_date_hijri: (e.event_date_hijri as string) ?? null,
      event_sort: (e.event_sort as number) ?? null,
      title: (e.title as string) ?? null,
      affected_articles: (e.affected_articles as string) ?? null,
      raw_text: (e.raw_text as string) ?? "",
      link_status: e.link_status as string,
      link_confidence: (e.link_confidence as string) ?? null,
      link_candidate_note: (e.link_candidate_note as string) ?? null,
      gazette_issue_number: g?.num ?? null,
      gazette_date_hijri: g?.date ?? null,
    };
  });

  return {
    id: inst.id as string,
    canonical_title: inst.canonical_title as string,
    instrument_kind: inst.instrument_kind as string,
    specialty_id: (inst.specialty_id as string) ?? null,
    specialty_name,
    first_reference_number: (inst.first_reference_number as string) ?? null,
    first_issue_date_hijri: (inst.first_issue_date_hijri as string) ?? null,
    status: inst.status as string,
    summary: (inst.summary as string) ?? null,
    events: timeline,
  };
}

// ============================================================
// getPendingLinkEvents — أحداث تحتاج تأكيد ربط يدويّ (غموض)
// ============================================================

export type PendingLinkEvent = {
  id: string;
  event_type: string;
  instrument_number: string | null;
  event_date_hijri: string | null;
  title: string | null;
  link_confidence: string | null;
  link_candidate_note: string | null;
  gazette_issue_number: string | null;
};

export async function getPendingLinkEvents(): Promise<PendingLinkEvent[]> {
  const a = supabaseAdmin;
  const { data: events } = await a
    .from("legal_events")
    .select(
      "id, event_type, instrument_number, event_date_hijri, title, link_confidence, link_candidate_note, gazette_issue_id"
    )
    .eq("link_status", "pending_link")
    .order("event_sort", { ascending: true, nullsFirst: true });

  if (!events || events.length === 0) return [];

  const gIds = [...new Set(events.map((e) => e.gazette_issue_id as string).filter(Boolean))];
  const gMap = new Map<string, string>();
  if (gIds.length > 0) {
    const { data: gz } = await a.from("gazette_issues").select("id, issue_number").in("id", gIds);
    (gz ?? []).forEach((g) => gMap.set(g.id as string, g.issue_number as string));
  }

  return events.map((e) => ({
    id: e.id as string,
    event_type: e.event_type as string,
    instrument_number: (e.instrument_number as string) ?? null,
    event_date_hijri: (e.event_date_hijri as string) ?? null,
    title: (e.title as string) ?? null,
    link_confidence: (e.link_confidence as string) ?? null,
    link_candidate_note: (e.link_candidate_note as string) ?? null,
    gazette_issue_number: e.gazette_issue_id ? gMap.get(e.gazette_issue_id as string) ?? null : null,
  }));
}

// ============================================================
// getInstrumentFilterOptions — خيارات الفلتر (تخصّص + نوع + حالة)
// ============================================================

export async function getInstrumentFilterOptions(): Promise<InstrumentFilterOptions> {
  const a = supabaseAdmin;
  const { data: specs } = await a
    .from("specialties")
    .select("id, name_ar")
    .eq("is_active", true)
    .order("name_ar");

  return {
    specialties: (specs ?? []).map((s) => ({ id: s.id as string, name_ar: s.name_ar as string })),
    kinds: Object.entries(KIND_LABEL).map(([value, label]) => ({ value, label })),
    statuses: Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label })),
  };
}

// ============================================================
// getInstrumentCounts — أرقام علويّة
// ============================================================

export async function getInstrumentCounts(): Promise<{ instruments: number; events: number; pending: number; gazette: number }> {
  const a = supabaseAdmin;
  const head = { count: "exact" as const, head: true };
  const [inst, ev, pend, gz] = await Promise.all([
    a.from("legal_instruments").select("*", head),
    a.from("legal_events").select("*", head),
    a.from("legal_events").select("*", head).eq("link_status", "pending_link"),
    a.from("gazette_issues").select("*", head),
  ]);
  return {
    instruments: inst.count ?? 0,
    events: ev.count ?? 0,
    pending: pend.count ?? 0,
    gazette: gz.count ?? 0,
  };
}
