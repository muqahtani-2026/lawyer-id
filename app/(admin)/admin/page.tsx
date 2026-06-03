import {
  getLawyerStats,
  getDraftStats,
  getQualityAvg,
  getDailyDrafts,
  getTopLawyers,
  getRecentActivity,
} from "@/lib/queries/admin";
import { AdminKpiCard } from "@/components/admin/AdminKpiCard";
import {
  DailyDraftsChart,
  TopLawyersDonut,
} from "@/components/admin/AdminCharts";
import { ActivityFeed } from "@/components/admin/ActivityFeed";

export default async function AdminOverviewPage() {
  const [
    lawyerStats,
    draftStats,
    qualityStats,
    dailyDrafts,
    topLawyers,
    recentActivity,
  ] = await Promise.all([
    getLawyerStats(),
    getDraftStats(),
    getQualityAvg(),
    getDailyDrafts(7),
    getTopLawyers(5),
    getRecentActivity(10),
  ]);

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto" style={{ direction: "rtl" }}>
      {/* Header */}
      <header className="mb-10">
        <div className="flex items-baseline gap-3 mb-2">
          <span
            className="text-xs font-mono tracking-[2px]"
            style={{ color: "#fbbf24" }}
          >
            ADMIN · OVERVIEW
          </span>
          <span className="text-xs font-mono tracking-wider text-[#8892b0]">
            Phase 6.1.b
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          نَظْرة عامّة على المنصّة
        </h1>
        <p className="text-[#8892b0] leading-relaxed max-w-2xl">
          إحصاءات شاملة عن جميع المحامين والمسوّدات على Lawyer ID.
        </p>
      </header>

      {/* 6 KPI Cards */}
      <section
        className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10"
        aria-label="KPIs"
      >
        <AdminKpiCard
          label="TOTAL LAWYERS"
          value={lawyerStats.total}
          subtext="إجماليّ المحامين المسجّلين"
        />
        <AdminKpiCard
          label="PENDING REVIEW"
          value={draftStats.pending}
          subtext="بانتظار مراجعة المحامي"
          tone="warning"
        />
        <AdminKpiCard
          label="APPROVED · 7 DAYS"
          value={draftStats.approvedThisWeek}
          subtext="مسوّدات مُعتمدة هذا الأسبوع"
          tone="success"
        />
        <AdminKpiCard
          label="QUALITY AVG"
          value={
            qualityStats.avg !== null ? `${qualityStats.avg}/100` : "—"
          }
          subtext={
            qualityStats.count > 0
              ? `من ${qualityStats.count} مسوّدة مُقيَّمة`
              : "لا توجد تقييمات بعد"
          }
        />
        <AdminKpiCard
          label="PUBLISHED"
          value={draftStats.published}
          subtext="إجماليّ المسوّدات المنشورة"
          tone="success"
        />
        <AdminKpiCard
          label="REJECTED"
          value={draftStats.rejected}
          subtext="إجماليّ المسوّدات المرفوضة"
          tone="danger"
        />
      </section>

      {/* Charts Row */}
      <section
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10"
        aria-label="Charts"
      >
        <DailyDraftsChart data={dailyDrafts} />
        <TopLawyersDonut data={topLawyers} />
      </section>

      {/* Activity Feed */}
      <section aria-label="Recent activity">
        <ActivityFeed events={recentActivity} />
      </section>
    </div>
  );
}
