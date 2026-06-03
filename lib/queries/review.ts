import { createClient } from "@/lib/supabase/server";

// ============================================================
// Types
// ============================================================

export interface DraftListSummary {
  id: string;
  draft_title: string | null;
  draft_summary: string | null;
  status: string;
  quality_score: number | null;
  created_at: string;
  source_title: string | null;
  legal_branch: string | null;
}

export interface DraftFull {
  id: string;
  draft_title: string | null;
  draft_summary: string | null;
  draft_content: string;
  draft_platform: string | null;
  draft_type: string | null;
  source_title: string | null;
  source_url: string | null;
  source_summary: string | null;
  legal_branch: string | null;
  tags: string[] | null;
  regulatory_references: string[] | null;
  references_verified: boolean | null;
  quality_score: number | null;
  rejection_reason: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  approved_at: string | null;
  published_at: string | null;
}

export interface ReviewFilters {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ReviewListResult {
  drafts: DraftListSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface StatusCounts {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
  published: number;
}

// ============================================================
// Constants
// ============================================================

const DEFAULT_PAGE_SIZE = 10;

// ============================================================
// Queries
// ============================================================

/**
 * Fetch a paginated, filtered, searchable list of drafts for the user.
 */
export async function getDraftsForReview(
  userId: string,
  filters: ReviewFilters = {}
): Promise<ReviewListResult> {
  const supabase = await createClient();

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from("content_drafts")
    .select(
      "id, draft_title, draft_summary, status, quality_score, created_at, source_title, legal_branch",
      { count: "exact" }
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  // Status filter
  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  // Search filter (sanitized to avoid breaking the or() syntax)
  if (filters.search?.trim()) {
    const term = filters.search.trim().replace(/[%,()]/g, "");
    if (term.length > 0) {
      query = query.or(
        `draft_title.ilike.%${term}%,draft_summary.ilike.%${term}%`
      );
    }
  }

  // Pagination
  query = query.range(offset, offset + pageSize - 1);

  const { data, count } = await query;

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    drafts: (data as DraftListSummary[]) ?? [],
    total,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Fetch a single draft by ID, scoped to the user.
 * Returns null if not found or not owned.
 */
export async function getDraftById(
  userId: string,
  draftId: string
): Promise<DraftFull | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("content_drafts")
    .select(
      "id, draft_title, draft_summary, draft_content, draft_platform, draft_type, " +
        "source_title, source_url, source_summary, legal_branch, tags, regulatory_references, " +
        "references_verified, quality_score, rejection_reason, status, " +
        "created_at, updated_at, reviewed_at, approved_at, published_at"
    )
    .eq("user_id", userId)
    .eq("id", draftId)
    .maybeSingle();

  return data as DraftFull | null;
}

/**
 * Get counts of drafts by status (for tab badges).
 */
export async function getStatusCounts(userId: string): Promise<StatusCounts> {
  const supabase = await createClient();

  const [total, pending, approved, rejected, published] = await Promise.all([
    supabase
      .from("content_drafts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("content_drafts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "pending"),
    supabase
      .from("content_drafts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "approved"),
    supabase
      .from("content_drafts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "rejected"),
    supabase
      .from("content_drafts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "published"),
  ]);

  return {
    all: total.count ?? 0,
    pending: pending.count ?? 0,
    approved: approved.count ?? 0,
    rejected: rejected.count ?? 0,
    published: published.count ?? 0,
  };
}
