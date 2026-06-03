import { createClient } from "@/lib/supabase/server";

// ============================================================
// Types
// ============================================================

export type AdminDraftRow = {
  id: string;
  draft_title: string | null;
  status: string;
  quality_score: number | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  lawyer_name: string | null;
  specialty_id: string | null;
  specialty_name: string | null;
  source_legal_id: string | null;
  source_legal_title: string | null;
};

export type AdminDraftDetail = {
  draft: {
    id: string;
    draft_title: string | null;
    draft_summary: string | null;
    draft_content: string;
    status: string;
    quality_score: number | null;
    rejection_reason: string | null;
    tags: string[] | null;
    regulatory_references: string[] | null;
    references_verified: boolean | null;
    draft_platform: string;
    draft_type: string;
    legal_branch: string | null;
    classification_confidence: number | null;
    created_at: string;
    updated_at: string;
    generated_at: string | null;
    reviewed_at: string | null;
    approved_at: string | null;
    published_at: string | null;
    sent_to_telegram_at: string | null;
    sent_to_email_at: string | null;
    source_title: string | null;
    source_url: string | null;
    source_summary: string | null;
  };
  lawyer: {
    id: string;
    full_name: string | null;
    email: string;
  };
  specialty: {
    id: string;
    name_ar: string;
  } | null;
  source_legal: {
    id: string;
    title: string;
    reference_number: string | null;
  } | null;
};

export type DraftFilterOptions = {
  lawyers: { id: string; name: string }[];
  specialties: { id: string; name_ar: string }[];
};

// ============================================================
// listAllDrafts — fetches all drafts + joined data
// ============================================================

/**
 * Fetches up to 500 most recent drafts across all lawyers.
 * Uses 1 main query + 3 parallel batch queries for joined data.
 */
export async function listAllDrafts(): Promise<AdminDraftRow[]> {
  const supabase = await createClient();

  const { data: drafts } = await supabase
    .from("content_drafts")
    .select(
      "id, draft_title, status, quality_score, created_at, updated_at, user_id, specialty_id, source_legal_id"
    )
    .order("updated_at", { ascending: false })
    .limit(500);

  if (!drafts || drafts.length === 0) return [];

  const userIds = [
    ...new Set(
      drafts.map((d) => d.user_id as string).filter(Boolean)
    ),
  ];
  const specIds = [
    ...new Set(
      drafts.map((d) => d.specialty_id as string).filter(Boolean)
    ),
  ];
  const legalIds = [
    ...new Set(
      drafts.map((d) => d.source_legal_id as string).filter(Boolean)
    ),
  ];

  const [profilesRes, specsRes, legalRes] = await Promise.all([
    userIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
    specIds.length > 0
      ? supabase
          .from("specialties")
          .select("id, name_ar")
          .in("id", specIds)
      : Promise.resolve({ data: [] as { id: string; name_ar: string }[] }),
    legalIds.length > 0
      ? supabase
          .from("legal_corpus")
          .select("id, title")
          .in("id", legalIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);

  const nameMap = new Map(
    (profilesRes.data ?? []).map((p) => [
      p.id as string,
      (p.full_name as string | null) ?? null,
    ])
  );
  const specMap = new Map(
    (specsRes.data ?? []).map((s) => [s.id as string, s.name_ar as string])
  );
  const legalMap = new Map(
    (legalRes.data ?? []).map((l) => [l.id as string, l.title as string])
  );

  return drafts.map((d: any) => ({
    id: d.id as string,
    draft_title: (d.draft_title as string | null) ?? null,
    status: d.status as string,
    quality_score: (d.quality_score as number | null) ?? null,
    created_at: d.created_at as string,
    updated_at: d.updated_at as string,
    user_id: d.user_id as string,
    lawyer_name: d.user_id ? nameMap.get(d.user_id) ?? null : null,
    specialty_id: (d.specialty_id as string | null) ?? null,
    specialty_name: d.specialty_id ? specMap.get(d.specialty_id) ?? null : null,
    source_legal_id: (d.source_legal_id as string | null) ?? null,
    source_legal_title: d.source_legal_id
      ? legalMap.get(d.source_legal_id) ?? null
      : null,
  }));
}

// ============================================================
// getDraftFilterOptions — dropdowns data
// ============================================================

export async function getDraftFilterOptions(): Promise<DraftFilterOptions> {
  const supabase = await createClient();

  const [profilesRes, specsRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name").order("full_name"),
    supabase
      .from("specialties")
      .select("id, name_ar")
      .eq("is_active", true)
      .order("name_ar"),
  ]);

  return {
    lawyers: (profilesRes.data ?? []).map((p) => ({
      id: p.id as string,
      name: (p.full_name as string | null) ?? "—",
    })),
    specialties: (specsRes.data ?? []).map((s) => ({
      id: s.id as string,
      name_ar: s.name_ar as string,
    })),
  };
}

// ============================================================
// getDraftDetail — single draft full data
// ============================================================

export async function getDraftDetail(
  draftId: string
): Promise<AdminDraftDetail | null> {
  const supabase = await createClient();

  const { data: draft } = await supabase
    .from("content_drafts")
    .select("*")
    .eq("id", draftId)
    .maybeSingle();

  if (!draft) return null;

  const [profileRes, specRes, legalRes] = await Promise.all([
    draft.user_id
      ? supabase
          .from("profiles")
          .select("id, full_name, email")
          .eq("id", draft.user_id)
          .maybeSingle()
      : Promise.resolve({ data: null as any }),
    draft.specialty_id
      ? supabase
          .from("specialties")
          .select("id, name_ar")
          .eq("id", draft.specialty_id)
          .maybeSingle()
      : Promise.resolve({ data: null as any }),
    draft.source_legal_id
      ? supabase
          .from("legal_corpus")
          .select("id, title, reference_number")
          .eq("id", draft.source_legal_id)
          .maybeSingle()
      : Promise.resolve({ data: null as any }),
  ]);

  // Without a lawyer record, the draft is orphaned (shouldn't happen due to FK, but defensive)
  if (!profileRes.data) return null;

  return {
    draft: {
      id: draft.id as string,
      draft_title: (draft.draft_title as string | null) ?? null,
      draft_summary: (draft.draft_summary as string | null) ?? null,
      draft_content: draft.draft_content as string,
      status: draft.status as string,
      quality_score: (draft.quality_score as number | null) ?? null,
      rejection_reason: (draft.rejection_reason as string | null) ?? null,
      tags: (draft.tags as string[] | null) ?? null,
      regulatory_references:
        (draft.regulatory_references as string[] | null) ?? null,
      references_verified:
        (draft.references_verified as boolean | null) ?? null,
      draft_platform: (draft.draft_platform as string) ?? "linkedin",
      draft_type: (draft.draft_type as string) ?? "news_commentary",
      legal_branch: (draft.legal_branch as string | null) ?? null,
      classification_confidence:
        (draft.classification_confidence as number | null) ?? null,
      created_at: draft.created_at as string,
      updated_at: draft.updated_at as string,
      generated_at: (draft.generated_at as string | null) ?? null,
      reviewed_at: (draft.reviewed_at as string | null) ?? null,
      approved_at: (draft.approved_at as string | null) ?? null,
      published_at: (draft.published_at as string | null) ?? null,
      sent_to_telegram_at:
        (draft.sent_to_telegram_at as string | null) ?? null,
      sent_to_email_at: (draft.sent_to_email_at as string | null) ?? null,
      source_title: (draft.source_title as string | null) ?? null,
      source_url: (draft.source_url as string | null) ?? null,
      source_summary: (draft.source_summary as string | null) ?? null,
    },
    lawyer: {
      id: profileRes.data.id as string,
      full_name: (profileRes.data.full_name as string | null) ?? null,
      email: profileRes.data.email as string,
    },
    specialty: specRes.data
      ? {
          id: specRes.data.id as string,
          name_ar: specRes.data.name_ar as string,
        }
      : null,
    source_legal: legalRes.data
      ? {
          id: legalRes.data.id as string,
          title: legalRes.data.title as string,
          reference_number:
            (legalRes.data.reference_number as string | null) ?? null,
        }
      : null,
  };
}
