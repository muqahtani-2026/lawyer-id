import { createClient } from "@/lib/supabase/server";

// =====================================================================
// Types
// =====================================================================

export type ReportsOverallKpis = {
  total_drafts: number;
  approval_rate: number; // 0-100 (approved + published) / total
  avg_quality: number; // 0-100
  avg_review_hours: number; // متوسط الفارق بين generated_at و reviewed_at بالساعات
};

export type QualityTrendPoint = {
  week_start: string; // ISO date (Sunday of the week)
  week_label: string; // "5 يونيو" مثلًا
  avg_quality: number; // 0 لو لا توجد بيانات
  count: number;
};

export type StatusDistributionRow = {
  status: string;
  label_ar: string;
  count: number;
};

export type TopLegalSourceRow = {
  source_legal_id: string;
  title: string;
  count: number;
};

export type LawyerPerformanceRow = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  is_admin: boolean;
  total_drafts: number;
  approval_rate: number; // 0-100
  avg_quality: number; // 0-100
  avg_review_hours: number;
};

export type GenerationVolumePoint = {
  day: string; // YYYY-MM-DD
  day_label: string; // "3 يو"
  count: number;
};

// =====================================================================
// Helpers (محلّيّة، لا تُصدَّر)
// =====================================================================

const AR_MONTHS_SHORT = [
  "ينا",
  "فبر",
  "مار",
  "أبر",
  "ماي",
  "يون",
  "يول",
  "أغس",
  "سبت",
  "أكت",
  "نوف",
  "ديس",
];

const STATUS_LABELS_AR: Record<string, string> = {
  pending: "بانتظار المراجعة",
  approved: "مُعتمدة",
  rejected: "مرفوضة",
  published: "مَنشورة",
};

function dayKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayLabel(d: Date): string {
  return `${d.getUTCDate()} ${AR_MONTHS_SHORT[d.getUTCMonth()]}`;
}

// بداية أسبوع تبدأ يوم الأحد (UTC)
function startOfWeekSunday(d: Date): Date {
  const x = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
  const dow = x.getUTCDay(); // 0 = Sunday
  x.setUTCDate(x.getUTCDate() - dow);
  return x;
}

function hoursBetween(a: string, b: string): number {
  const ta = new Date(a).getTime();
  const tb = new Date(b).getTime();
  return Math.max(0, (tb - ta) / (1000 * 60 * 60));
}

function roundOne(n: number): number {
  return Math.round(n * 10) / 10;
}

// =====================================================================
// 1) إجماليّات الـ KPIs
// =====================================================================

export async function getReportsOverallKpis(): Promise<ReportsOverallKpis> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_drafts")
    .select("status, quality_score, generated_at, reviewed_at");

  if (error || !data) {
    return {
      total_drafts: 0,
      approval_rate: 0,
      avg_quality: 0,
      avg_review_hours: 0,
    };
  }

  const total = data.length;
  if (total === 0) {
    return {
      total_drafts: 0,
      approval_rate: 0,
      avg_quality: 0,
      avg_review_hours: 0,
    };
  }

  // معدّل الموافقة: approved + published من إجماليّ المسوّدات التي تمّت مراجعتها
  const reviewedCount = data.filter((r) => r.reviewed_at !== null).length;
  const approvedCount = data.filter(
    (r) => r.status === "approved" || r.status === "published"
  ).length;
  const approval_rate =
    reviewedCount > 0 ? (approvedCount / reviewedCount) * 100 : 0;

  // متوسط الجودة
  const withQuality = data.filter(
    (r) => r.quality_score !== null && r.quality_score !== undefined
  );
  const avg_quality =
    withQuality.length > 0
      ? withQuality.reduce((s, r) => s + (r.quality_score as number), 0) /
        withQuality.length
      : 0;

  // متوسط زمن المراجعة (ساعات)
  const reviewed = data.filter(
    (r) => r.reviewed_at !== null && r.generated_at !== null
  );
  const avg_review_hours =
    reviewed.length > 0
      ? reviewed.reduce(
          (s, r) => s + hoursBetween(r.generated_at, r.reviewed_at as string),
          0
        ) / reviewed.length
      : 0;

  return {
    total_drafts: total,
    approval_rate: roundOne(approval_rate),
    avg_quality: roundOne(avg_quality),
    avg_review_hours: roundOne(avg_review_hours),
  };
}

// =====================================================================
// 2) اتّجاه الجودة عبر آخر 8 أسابيع
// =====================================================================

export async function getQualityTrend(): Promise<QualityTrendPoint[]> {
  const supabase = await createClient();

  // آخر 8 أسابيع تبدأ من أحد الأسبوع الحاليّ - 7 أسابيع
  const now = new Date();
  const currentWeekStart = startOfWeekSunday(now);
  const earliest = new Date(currentWeekStart);
  earliest.setUTCDate(earliest.getUTCDate() - 7 * 7); // 8 buckets total

  const { data, error } = await supabase
    .from("content_drafts")
    .select("generated_at, quality_score")
    .gte("generated_at", earliest.toISOString())
    .not("quality_score", "is", null);

  // بناء 8 buckets فارغة
  const buckets: QualityTrendPoint[] = [];
  for (let i = 0; i < 8; i++) {
    const ws = new Date(earliest);
    ws.setUTCDate(ws.getUTCDate() + i * 7);
    buckets.push({
      week_start: dayKey(ws),
      week_label: dayLabel(ws),
      avg_quality: 0,
      count: 0,
    });
  }

  if (error || !data) {
    return buckets;
  }

  // تجميع: لكل صفّ، ابحث عن الـ bucket المناسب
  const sums: number[] = new Array(8).fill(0);
  const counts: number[] = new Array(8).fill(0);

  for (const row of data) {
    if (row.quality_score === null || row.generated_at === null) continue;
    const gen = new Date(row.generated_at);
    const ws = startOfWeekSunday(gen);
    const diffDays = Math.floor(
      (ws.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24)
    );
    const idx = Math.floor(diffDays / 7);
    if (idx < 0 || idx >= 8) continue;
    sums[idx] += row.quality_score as number;
    counts[idx] += 1;
  }

  for (let i = 0; i < 8; i++) {
    if (counts[i] > 0) {
      buckets[i].avg_quality = roundOne(sums[i] / counts[i]);
      buckets[i].count = counts[i];
    }
  }

  return buckets;
}

// =====================================================================
// 3) توزيع الـ statuses (للـ Donut)
// =====================================================================

export async function getStatusDistribution(): Promise<
  StatusDistributionRow[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("content_drafts").select("status");

  if (error || !data) return [];

  const counts: Record<string, number> = {};
  for (const r of data) {
    if (!r.status) continue;
    counts[r.status] = (counts[r.status] || 0) + 1;
  }

  // ترتيب: pending → approved → published → rejected
  const order = ["pending", "approved", "published", "rejected"];
  const result: StatusDistributionRow[] = [];

  for (const s of order) {
    if (counts[s]) {
      result.push({
        status: s,
        label_ar: STATUS_LABELS_AR[s] ?? s,
        count: counts[s],
      });
    }
  }

  // أيّ statuses أخرى لم نتوقّعها
  for (const [s, c] of Object.entries(counts)) {
    if (!order.includes(s)) {
      result.push({ status: s, label_ar: s, count: c });
    }
  }

  return result;
}

// =====================================================================
// 4) أكثر الأنظمة استخدامًا (Top Legal Sources)
// =====================================================================

export async function getTopLegalSources(
  limit = 5
): Promise<TopLegalSourceRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_drafts")
    .select("source_legal_id")
    .not("source_legal_id", "is", null);

  if (error || !data || data.length === 0) return [];

  const counts: Record<string, number> = {};
  for (const r of data) {
    const id = r.source_legal_id as string | null;
    if (!id) continue;
    counts[id] = (counts[id] || 0) + 1;
  }

  const ids = Object.keys(counts);
  if (ids.length === 0) return [];

  // جلب العناوين دفعة واحدة
  const { data: legalRows, error: legalErr } = await supabase
    .from("legal_corpus")
    .select("id, title")
    .in("id", ids);

  if (legalErr || !legalRows) return [];

  const titles: Record<string, string> = {};
  for (const r of legalRows) {
    titles[r.id] = r.title ?? "(بدون عنوان)";
  }

  const rows: TopLegalSourceRow[] = ids.map((id) => ({
    source_legal_id: id,
    title: titles[id] ?? "(نظام محذوف)",
    count: counts[id],
  }));

  rows.sort((a, b) => b.count - a.count);
  return rows.slice(0, limit);
}

// =====================================================================
// 5) أداء كلّ محامي
// =====================================================================

export async function getLawyerPerformance(): Promise<LawyerPerformanceRow[]> {
  const supabase = await createClient();

  // كلّ المحامين (بمن فيهم الإداريّ — يُولّد مسوّدات أيضًا)
  const { data: profiles, error: profilesErr } = await supabase
    .from("profiles")
    .select("id, full_name, email, is_admin");

  if (profilesErr || !profiles) return [];

  // كلّ المسوّدات
  const { data: drafts, error: draftsErr } = await supabase
    .from("content_drafts")
    .select("user_id, status, quality_score, generated_at, reviewed_at");

  const rows: LawyerPerformanceRow[] = [];

  for (const p of profiles) {
    const userDrafts =
      !draftsErr && drafts ? drafts.filter((d) => d.user_id === p.id) : [];

    const total = userDrafts.length;
    if (total === 0) {
      rows.push({
        user_id: p.id,
        full_name: p.full_name,
        email: p.email,
        is_admin: p.is_admin ?? false,
        total_drafts: 0,
        approval_rate: 0,
        avg_quality: 0,
        avg_review_hours: 0,
      });
      continue;
    }

    const reviewedCount = userDrafts.filter((d) => d.reviewed_at !== null)
      .length;
    const approvedCount = userDrafts.filter(
      (d) => d.status === "approved" || d.status === "published"
    ).length;
    const approval_rate =
      reviewedCount > 0 ? (approvedCount / reviewedCount) * 100 : 0;

    const withQuality = userDrafts.filter(
      (d) => d.quality_score !== null && d.quality_score !== undefined
    );
    const avg_quality =
      withQuality.length > 0
        ? withQuality.reduce((s, d) => s + (d.quality_score as number), 0) /
          withQuality.length
        : 0;

    const reviewed = userDrafts.filter(
      (d) => d.reviewed_at !== null && d.generated_at !== null
    );
    const avg_review_hours =
      reviewed.length > 0
        ? reviewed.reduce(
            (s, d) =>
              s + hoursBetween(d.generated_at, d.reviewed_at as string),
            0
          ) / reviewed.length
        : 0;

    rows.push({
      user_id: p.id,
      full_name: p.full_name,
      email: p.email,
      is_admin: p.is_admin ?? false,
      total_drafts: total,
      approval_rate: roundOne(approval_rate),
      avg_quality: roundOne(avg_quality),
      avg_review_hours: roundOne(avg_review_hours),
    });
  }

  // ترتيب: الأكثر مسوّدات أوّلًا
  rows.sort((a, b) => b.total_drafts - a.total_drafts);
  return rows;
}

// =====================================================================
// 6) حجم التوليد اليوميّ (آخر 30 يومًا)
// =====================================================================

export async function getGenerationVolume(
  days = 30
): Promise<GenerationVolumePoint[]> {
  const supabase = await createClient();

  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const earliest = new Date(today);
  earliest.setUTCDate(earliest.getUTCDate() - (days - 1));

  // بناء buckets فارغة لكلّ يوم
  const buckets: GenerationVolumePoint[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(earliest);
    d.setUTCDate(d.getUTCDate() + i);
    buckets.push({
      day: dayKey(d),
      day_label: dayLabel(d),
      count: 0,
    });
  }

  const { data, error } = await supabase
    .from("content_drafts")
    .select("generated_at")
    .gte("generated_at", earliest.toISOString());

  if (error || !data) return buckets;

  // index by day
  const idxByDay: Record<string, number> = {};
  for (let i = 0; i < buckets.length; i++) {
    idxByDay[buckets[i].day] = i;
  }

  for (const r of data) {
    if (!r.generated_at) continue;
    const d = new Date(r.generated_at);
    const key = dayKey(
      new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    );
    const idx = idxByDay[key];
    if (idx !== undefined) {
      buckets[idx].count += 1;
    }
  }

  return buckets;
}
