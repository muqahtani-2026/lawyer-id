import { createClient } from "@/lib/supabase/server";

// ============================================================
// Types
// ============================================================

export type LawyerStats = {
  total: number;
};

export type DraftStats = {
  pending: number;
  approved: number;
  rejected: number;
  published: number;
  total: number;
  approvedThisWeek: number;
};

export type QualityStats = {
  avg: number | null;
  count: number; // عدد المسوّدات التي لها quality_score
};

export type DailyDraftPoint = {
  date: string; // YYYY-MM-DD
  count: number;
};

export type TopLawyer = {
  user_id: string;
  full_name: string | null;
  count: number;
};

export type ActivityEventType =
  | "draft_created"
  | "draft_approved"
  | "draft_rejected"
  | "draft_published";

export type ActivityEvent = {
  id: string;
  type: ActivityEventType;
  draft_id: string;
  user_name: string | null;
  draft_title: string | null;
  occurred_at: string;
};

// ============================================================
// Queries
// ============================================================

/**
 * Total lawyer count (all profiles, since every signup creates a profile).
 */
export async function getLawyerStats(): Promise<LawyerStats> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });
  return { total: count ?? 0 };
}

/**
 * Draft counts by status + this-week approved bucket.
 * Uses parallel HEAD requests (count-only) for performance.
 */
export async function getDraftStats(): Promise<DraftStats> {
  const supabase = await createClient();
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const [
    pending,
    approved,
    rejected,
    published,
    total,
    approvedThisWeek,
  ] = await Promise.all([
    supabase
      .from("content_drafts")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("content_drafts")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved"),
    supabase
      .from("content_drafts")
      .select("*", { count: "exact", head: true })
      .eq("status", "rejected"),
    supabase
      .from("content_drafts")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("content_drafts")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("content_drafts")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved")
      .gte("approved_at", sevenDaysAgo),
  ]);

  return {
    pending: pending.count ?? 0,
    approved: approved.count ?? 0,
    rejected: rejected.count ?? 0,
    published: published.count ?? 0,
    total: total.count ?? 0,
    approvedThisWeek: approvedThisWeek.count ?? 0,
  };
}

/**
 * Average quality_score across drafts that have a score.
 */
export async function getQualityAvg(): Promise<QualityStats> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("content_drafts")
    .select("quality_score")
    .not("quality_score", "is", null);

  if (!data || data.length === 0) {
    return { avg: null, count: 0 };
  }

  const sum = data.reduce(
    (acc, row) => acc + (row.quality_score ?? 0),
    0
  );
  return {
    avg: Math.round((sum / data.length) * 10) / 10,
    count: data.length,
  };
}

/**
 * Draft count per day for the last N days.
 * Fills missing days with 0 to keep chart continuous.
 */
export async function getDailyDrafts(
  days: number = 7
): Promise<DailyDraftPoint[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const { data } = await supabase
    .from("content_drafts")
    .select("created_at")
    .gte("created_at", since.toISOString());

  // Initialize all days in range with 0
  const counts = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    counts.set(d.toISOString().slice(0, 10), 0);
  }

  // Add actual counts
  (data ?? []).forEach((row) => {
    const date = (row.created_at as string).slice(0, 10);
    if (counts.has(date)) {
      counts.set(date, (counts.get(date) ?? 0) + 1);
    }
  });

  return Array.from(counts.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Top N lawyers by total draft count.
 * Explicit two-step fetch (drafts + profiles) for clarity over
 * relying on Supabase relationship cache.
 */
export async function getTopLawyers(
  limit: number = 5
): Promise<TopLawyer[]> {
  const supabase = await createClient();

  const { data: drafts } = await supabase
    .from("content_drafts")
    .select("user_id");

  if (!drafts || drafts.length === 0) return [];

  // Count per user_id
  const counts = new Map<string, number>();
  drafts.forEach((row) => {
    if (!row.user_id) return;
    counts.set(row.user_id, (counts.get(row.user_id) ?? 0) + 1);
  });

  // Top N
  const sorted = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  if (sorted.length === 0) return [];

  // Fetch names for top user_ids
  const userIds = sorted.map(([id]) => id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);

  const nameMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.full_name as string | null])
  );

  return sorted.map(([user_id, count]) => ({
    user_id,
    full_name: nameMap.get(user_id) ?? null,
    count,
  }));
}

/**
 * Recent activity feed — emits an event per state transition.
 * One draft can produce multiple events (created → approved → published).
 */
export async function getRecentActivity(
  limit: number = 10
): Promise<ActivityEvent[]> {
  const supabase = await createClient();

  // Pull recent drafts (over-fetch to give the transition-emitter room)
  const { data: drafts } = await supabase
    .from("content_drafts")
    .select(
      "id, user_id, draft_title, status, created_at, approved_at, published_at, reviewed_at"
    )
    .order("updated_at", { ascending: false })
    .limit(limit * 3);

  if (!drafts || drafts.length === 0) return [];

  // Fetch names for all user_ids in this batch
  const userIds = [
    ...new Set(drafts.map((d) => d.user_id).filter(Boolean) as string[]),
  ];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);
  const nameMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.full_name as string | null])
  );

  // Emit transition events
  const events: ActivityEvent[] = [];

  drafts.forEach((row) => {
    const userName = row.user_id ? nameMap.get(row.user_id) ?? null : null;
    const base = {
      draft_id: row.id as string,
      user_name: userName,
      draft_title: row.draft_title as string | null,
    };

    if (row.created_at) {
      events.push({
        id: `${row.id}-created`,
        type: "draft_created",
        occurred_at: row.created_at as string,
        ...base,
      });
    }
    if (row.approved_at) {
      events.push({
        id: `${row.id}-approved`,
        type: "draft_approved",
        occurred_at: row.approved_at as string,
        ...base,
      });
    }
    if (row.published_at) {
      events.push({
        id: `${row.id}-published`,
        type: "draft_published",
        occurred_at: row.published_at as string,
        ...base,
      });
    }
    if (row.status === "rejected" && row.reviewed_at) {
      events.push({
        id: `${row.id}-rejected`,
        type: "draft_rejected",
        occurred_at: row.reviewed_at as string,
        ...base,
      });
    }
  });

  // Sort newest first, take limit
  return events
    .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
    .slice(0, limit);
}
