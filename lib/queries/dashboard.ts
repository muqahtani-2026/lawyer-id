import { createClient } from "@/lib/supabase/server";

// ============================================================
// Types
// ============================================================

export interface DashboardKPIs {
  totalDrafts: number;
  pendingDrafts: number;
  approvedDrafts: number;
  approvedToday: number;
  approvedThisWeek: number;
}

export interface AgentStatus {
  status: "active" | "inactive";
  lastRunAt: string | null;
  draftsToday: number;
  hoursSinceLastRun: number | null;
}

export interface ProfileCompletion {
  percentage: number;
  filledCount: number;
  totalFields: number;
  missingFields: string[];
}

export interface DraftListItem {
  id: string;
  draft_title: string | null;
  draft_summary: string | null;
  status: string;
  quality_score: number | null;
  created_at: string;
  source_title: string | null;
  draft_type: string | null;
}

export interface DraftsByDay {
  date: string;
  label: string;
  count: number;
}

export interface DraftsByStatus {
  status: string;
  label: string;
  count: number;
}

// ============================================================
// Helpers
// ============================================================

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number): Date {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() - n);
  return d;
}

// ============================================================
// Queries
// ============================================================

/**
 * Get dashboard KPIs: total, pending, approved counts + today + this week.
 * Runs 5 parallel count queries.
 */
export async function getDashboardKPIs(userId: string): Promise<DashboardKPIs> {
  const supabase = await createClient();

  const todayISO = startOfDay(new Date()).toISOString();
  const weekAgoISO = daysAgo(7).toISOString();

  const [total, pending, approved, approvedToday, approvedWeek] = await Promise.all([
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
      .eq("status", "approved")
      .gte("approved_at", todayISO),
    supabase
      .from("content_drafts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "approved")
      .gte("approved_at", weekAgoISO),
  ]);

  return {
    totalDrafts: total.count ?? 0,
    pendingDrafts: pending.count ?? 0,
    approvedDrafts: approved.count ?? 0,
    approvedToday: approvedToday.count ?? 0,
    approvedThisWeek: approvedWeek.count ?? 0,
  };
}

/**
 * Get content agent status: active if any draft was generated in last 48 hours.
 */
export async function getAgentStatus(userId: string): Promise<AgentStatus> {
  const supabase = await createClient();

  const { data: lastDraft } = await supabase
    .from("content_drafts")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const todayISO = startOfDay(new Date()).toISOString();
  const { count: draftsToday } = await supabase
    .from("content_drafts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", todayISO);

  let status: "active" | "inactive" = "inactive";
  let hoursSinceLastRun: number | null = null;

  if (lastDraft?.created_at) {
    const lastTime = new Date(lastDraft.created_at).getTime();
    const now = Date.now();
    hoursSinceLastRun = (now - lastTime) / (1000 * 60 * 60);
    if (hoursSinceLastRun <= 48) {
      status = "active";
    }
  }

  return {
    status,
    lastRunAt: lastDraft?.created_at ?? null,
    draftsToday: draftsToday ?? 0,
    hoursSinceLastRun,
  };
}

/**
 * Calculate profile completion percentage based on 7 fields.
 * Each field counts as ~14.3%.
 */
export async function getProfileCompletion(userId: string): Promise<ProfileCompletion> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("lawyer_profiles")
    .select(
      "target_audience, writing_style, preferred_length, favorite_phrases, avoided_phrases, style_notes"
    )
    .eq("user_id", userId)
    .maybeSingle();

  const { count: samplesCount } = await supabase
    .from("writing_samples")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const checks: { key: string; label: string; filled: boolean }[] = [
    {
      key: "target_audience",
      label: "الجمهور المُستهدَف",
      filled: !!profile?.target_audience?.trim(),
    },
    {
      key: "writing_style",
      label: "أسلوب الكتابة",
      filled: !!profile?.writing_style,
    },
    {
      key: "preferred_length",
      label: "الطول المُفضَّل",
      filled: !!profile?.preferred_length,
    },
    {
      key: "favorite_phrases",
      label: "عبارات مُفضَّلة (3 على الأقلّ)",
      filled: (profile?.favorite_phrases?.length ?? 0) >= 3,
    },
    {
      key: "avoided_phrases",
      label: "عبارات مُتجنَّبة (3 على الأقلّ)",
      filled: (profile?.avoided_phrases?.length ?? 0) >= 3,
    },
    {
      key: "style_notes",
      label: "ملاحظات الأسلوب",
      filled: !!profile?.style_notes?.trim(),
    },
    {
      key: "writing_samples",
      label: "عيّنات كتابة (3 على الأقلّ)",
      filled: (samplesCount ?? 0) >= 3,
    },
  ];

  const filledCount = checks.filter((c) => c.filled).length;
  const totalFields = checks.length;
  const percentage = Math.round((filledCount / totalFields) * 100);
  const missingFields = checks.filter((c) => !c.filled).map((c) => c.label);

  return { percentage, filledCount, totalFields, missingFields };
}

/**
 * Get the most recent drafts for a user (default 3).
 */
export async function getRecentDrafts(
  userId: string,
  limit = 3
): Promise<DraftListItem[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("content_drafts")
    .select(
      "id, draft_title, draft_summary, status, quality_score, created_at, source_title, draft_type"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

/**
 * Get drafts grouped by day for the last N days (default 7).
 * Returns array sorted from oldest to newest, with Arabic day labels.
 */
export async function getDraftsByDay(
  userId: string,
  days = 7
): Promise<DraftsByDay[]> {
  const supabase = await createClient();

  const startISO = daysAgo(days - 1).toISOString();

  const { data } = await supabase
    .from("content_drafts")
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", startISO);

  // Initialize buckets for each of the last N days
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = daysAgo(i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, 0);
  }

  // Fill buckets from data
  for (const row of data ?? []) {
    const key = row.created_at.slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  // Arabic short day names (Sunday-first per JS Date.getDay)
  const dayLabels = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

  return Array.from(buckets.entries()).map(([date, count]) => {
    const d = new Date(date);
    return {
      date,
      label: dayLabels[d.getDay()],
      count,
    };
  });
}

/**
 * Get drafts grouped by status for the donut chart.
 * Maps status keys to Arabic labels.
 */
export async function getDraftsByStatus(
  userId: string
): Promise<DraftsByStatus[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("content_drafts")
    .select("status")
    .eq("user_id", userId);

  const statusLabels: Record<string, string> = {
    pending: "بانتظار المراجعة",
    approved: "مقبولة",
    rejected: "مرفوضة",
    published: "منشورة",
  };

  const grouped = new Map<string, number>();
  for (const row of data ?? []) {
    const status = row.status ?? "unknown";
    grouped.set(status, (grouped.get(status) ?? 0) + 1);
  }

  return Array.from(grouped.entries()).map(([status, count]) => ({
    status,
    label: statusLabels[status] ?? status,
    count,
  }));
}
