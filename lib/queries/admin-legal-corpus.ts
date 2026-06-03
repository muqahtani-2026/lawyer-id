import { createClient } from "@/lib/supabase/server";

// ============================================================
// Types
// ============================================================

export type LegalCorpusRow = {
  id: string;
  title: string;
  document_type: string | null;
  source_authority: string | null;
  specialty_id: string | null;
  specialty_name: string | null;
  reference_number: string | null;
  issue_date: string | null;
  effective_date: string | null;
  tags: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  drafts_count: number;
};

export type LegalCorpusDetail = LegalCorpusRow & {
  summary: string | null;
  full_text: string;
  source_url: string | null;
  uploaded_by: string | null;
};

export type LegalCorpusFormOptions = {
  specialties: { id: string; name_ar: string }[];
};

// ============================================================
// listLegalCorpus — table data with specialty names + drafts count
// ============================================================

export async function listLegalCorpus(): Promise<LegalCorpusRow[]> {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("legal_corpus")
    .select(
      "id, title, document_type, source_authority, specialty_id, reference_number, issue_date, effective_date, tags, is_active, created_at, updated_at"
    )
    .order("updated_at", { ascending: false });

  if (!rows || rows.length === 0) return [];

  // Resolve specialty names
  const specIds = [
    ...new Set(
      rows.map((r) => r.specialty_id as string).filter(Boolean)
    ),
  ];

  let specNameMap = new Map<string, string>();
  if (specIds.length > 0) {
    const { data: specs } = await supabase
      .from("specialties")
      .select("id, name_ar")
      .in("id", specIds);
    specNameMap = new Map(
      (specs ?? []).map((s) => [s.id as string, s.name_ar as string])
    );
  }

  // Drafts count per corpus row
  const corpusIds = rows.map((r) => r.id as string);
  const { data: drafts } = await supabase
    .from("content_drafts")
    .select("source_legal_id")
    .in("source_legal_id", corpusIds);

  const draftCounts = new Map<string, number>();
  (drafts ?? []).forEach((d: any) => {
    if (!d.source_legal_id) return;
    draftCounts.set(
      d.source_legal_id,
      (draftCounts.get(d.source_legal_id) ?? 0) + 1
    );
  });

  return rows.map((r: any) => ({
    id: r.id as string,
    title: r.title as string,
    document_type: (r.document_type as string | null) ?? null,
    source_authority: (r.source_authority as string | null) ?? null,
    specialty_id: (r.specialty_id as string | null) ?? null,
    specialty_name: r.specialty_id
      ? specNameMap.get(r.specialty_id) ?? null
      : null,
    reference_number: (r.reference_number as string | null) ?? null,
    issue_date: (r.issue_date as string | null) ?? null,
    effective_date: (r.effective_date as string | null) ?? null,
    tags: (r.tags as string[] | null) ?? null,
    is_active: (r.is_active as boolean) ?? true,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
    drafts_count: draftCounts.get(r.id as string) ?? 0,
  }));
}

// ============================================================
// getLegalCorpusDetail — single corpus + counts
// ============================================================

export async function getLegalCorpusDetail(
  id: string
): Promise<LegalCorpusDetail | null> {
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("legal_corpus")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!row) return null;

  let specialty_name: string | null = null;
  if (row.specialty_id) {
    const { data: spec } = await supabase
      .from("specialties")
      .select("name_ar")
      .eq("id", row.specialty_id)
      .maybeSingle();
    specialty_name = (spec?.name_ar as string | undefined) ?? null;
  }

  const { count } = await supabase
    .from("content_drafts")
    .select("*", { count: "exact", head: true })
    .eq("source_legal_id", id);

  return {
    id: row.id as string,
    title: row.title as string,
    document_type: (row.document_type as string | null) ?? null,
    source_authority: (row.source_authority as string | null) ?? null,
    specialty_id: (row.specialty_id as string | null) ?? null,
    specialty_name,
    reference_number: (row.reference_number as string | null) ?? null,
    issue_date: (row.issue_date as string | null) ?? null,
    effective_date: (row.effective_date as string | null) ?? null,
    tags: (row.tags as string[] | null) ?? null,
    is_active: (row.is_active as boolean) ?? true,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    summary: (row.summary as string | null) ?? null,
    full_text: row.full_text as string,
    source_url: (row.source_url as string | null) ?? null,
    uploaded_by: (row.uploaded_by as string | null) ?? null,
    drafts_count: count ?? 0,
  };
}

// ============================================================
// getCorpusFormOptions — dropdown data
// ============================================================

export async function getCorpusFormOptions(): Promise<LegalCorpusFormOptions> {
  const supabase = await createClient();

  const { data: specs } = await supabase
    .from("specialties")
    .select("id, name_ar")
    .eq("is_active", true)
    .order("name_ar");

  return {
    specialties: (specs ?? []).map((s) => ({
      id: s.id as string,
      name_ar: s.name_ar as string,
    })),
  };
}
