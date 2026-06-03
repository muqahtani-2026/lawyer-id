import { createClient } from "@/lib/supabase/server";

// =====================================================================
// Types
// =====================================================================

export type OperationsKpis = {
  active_lawyers: number; // محامون بمسوّدة واحدة على الأقلّ في آخر 7 أيام
  drafts_today: number;
  drafts_last_7_days: number;
  pending_review: number; // مسوّدات status = pending (كلّ الزمن)
};

export type DailyOperationsPoint = {
  date: string; // YYYY-MM-DD
  label: string; // "4 يون"
  generated: number;
  reviewed: number;
};

export type LawyerCoverageRow = {
  user_id: string;
  full_name: string;
  email: string;
  is_admin: boolean;
  drafts_last_7_days: number;
  total_drafts: number;
  last_activity: string | null; // ISO
  is_active: boolean; // drafts_last_7_days > 0
  telegram_enabled: boolean;
  email_enabled: boolean;
  preferred_send_hour: number | null;
};

// =====================================================================
// Helpers
// =====================================================================

const AR_MONTHS_SHORT = [
  "ينا", "فبر", "مار", "أبر", "ماي", "يون",
  "يول", "أغس", "سبت", "أكت", "نوف", "ديس",
];

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayLabel(d: Date): string {
  return `${d.getDate()} ${AR_MONTHS_SHORT[d.getMonth()]}`;
}

function startOfToday(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

// =====================================================================
// Queries
// =====================================================================

/**
 * 4 KPIs للوحة التشغيل اليوميّ
 */
export async function getOperationsKpis(): Promise<OperationsKpis> {
  const supabase = await createClient();

  const todayStart = startOfToday();
  const sevenDaysAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

  // جلب مسوّدات آخر 7 أيام (لـ KPIs 1, 2, 3)
  const { data: recentDrafts, error: e1 } = await supabase
    .from("content_drafts")
    .select("id, user_id, generated_at")
    .gte("generated_at", sevenDaysAgo.toISOString());

  if (e1) console.error("[ops kpis] recent error:", e1);

  const drafts = recentDrafts ?? [];

  const draftsToday = drafts.filter(
    (d) => new Date(d.generated_at) >= todayStart
  ).length;

  const activeLawyersSet = new Set(drafts.map((d) => d.user_id));

  // pending review (كلّ الزمن)
  const { count: pendingCount, error: e2 } = await supabase
    .from("content_drafts")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  if (e2) console.error("[ops kpis] pending error:", e2);

  return {
    active_lawyers: activeLawyersSet.size,
    drafts_today: draftsToday,
    drafts_last_7_days: drafts.length,
    pending_review: pendingCount ?? 0,
  };
}

/**
 * آخر 14 يومًا: المسوّدات المُولّدة + المُراجَعة لكلّ يوم
 */
export async function getDraftsLast14Days(): Promise<DailyOperationsPoint[]> {
  const supabase = await createClient();

  const todayStart = startOfToday();
  const start = new Date(
    todayStart.getFullYear(),
    todayStart.getMonth(),
    todayStart.getDate() - 13 // 14 أيام شامل اليوم
  );

  const { data, error } = await supabase
    .from("content_drafts")
    .select("generated_at, reviewed_at")
    .gte("generated_at", start.toISOString());

  if (error) {
    console.error("[ops chart] error:", error);
    return [];
  }

  // 14 يومًا مع 0 افتراضيًّا
  const days: Record<string, { generated: number; reviewed: number }> = {};
  for (let i = 0; i < 14; i++) {
    const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    days[dayKey(d)] = { generated: 0, reviewed: 0 };
  }

  // عدّ الأحداث
  for (const row of data ?? []) {
    const genKey = dayKey(new Date(row.generated_at));
    if (days[genKey]) days[genKey].generated += 1;

    if (row.reviewed_at) {
      const revKey = dayKey(new Date(row.reviewed_at));
      if (days[revKey]) days[revKey].reviewed += 1;
    }
  }

  // مصفوفة مرتّبة
  const result: DailyOperationsPoint[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const key = dayKey(d);
    result.push({
      date: key,
      label: dayLabel(d),
      generated: days[key].generated,
      reviewed: days[key].reviewed,
    });
  }

  return result;
}

/**
 * تغطية المحامين: لكلّ محامي (بما فيهم admin) — مسوّدات + قنوات + نشاط
 */
export async function getLawyerCoverage(): Promise<LawyerCoverageRow[]> {
  const supabase = await createClient();

  // 1) كلّ الـ profiles
  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("id, full_name, email, is_admin")
    .order("full_name", { ascending: true });

  if (pErr || !profiles) {
    console.error("[ops coverage] profiles error:", pErr);
    return [];
  }

  // 2) مسوّدات آخر 7 أيام
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const { data: recentDrafts } = await supabase
    .from("content_drafts")
    .select("user_id, generated_at")
    .gte("generated_at", sevenDaysAgo.toISOString());

  // 3) كلّ المسوّدات (للإجماليّ + آخر نشاط)
  const { data: allDrafts } = await supabase
    .from("content_drafts")
    .select("user_id, generated_at, updated_at");

  // 4) تفضيلات الإشعارات
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select(
      "user_id, telegram_enabled, email_enabled, preferred_send_hour"
    );

  // maps للحساب السريع
  const recentByUser: Record<string, number> = {};
  for (const r of recentDrafts ?? []) {
    recentByUser[r.user_id] = (recentByUser[r.user_id] ?? 0) + 1;
  }

  const totalByUser: Record<string, number> = {};
  const lastActivityByUser: Record<string, string> = {};
  for (const d of allDrafts ?? []) {
    totalByUser[d.user_id] = (totalByUser[d.user_id] ?? 0) + 1;
    const lastSeen = d.updated_at || d.generated_at;
    if (
      !lastActivityByUser[d.user_id] ||
      lastSeen > lastActivityByUser[d.user_id]
    ) {
      lastActivityByUser[d.user_id] = lastSeen;
    }
  }

  const prefsByUser: Record<
    string,
    {
      telegram_enabled: boolean;
      email_enabled: boolean;
      preferred_send_hour: number | null;
    }
  > = {};
  for (const p of prefs ?? []) {
    prefsByUser[p.user_id] = {
      telegram_enabled: p.telegram_enabled ?? false,
      email_enabled: p.email_enabled ?? false,
      preferred_send_hour: p.preferred_send_hour ?? null,
    };
  }

  return profiles.map((p) => ({
    user_id: p.id,
    full_name: p.full_name ?? "",
    email: p.email ?? "",
    is_admin: p.is_admin ?? false,
    drafts_last_7_days: recentByUser[p.id] ?? 0,
    total_drafts: totalByUser[p.id] ?? 0,
    last_activity: lastActivityByUser[p.id] ?? null,
    is_active: (recentByUser[p.id] ?? 0) > 0,
    telegram_enabled: prefsByUser[p.id]?.telegram_enabled ?? false,
    email_enabled: prefsByUser[p.id]?.email_enabled ?? false,
    preferred_send_hour: prefsByUser[p.id]?.preferred_send_hour ?? null,
  }));
}
