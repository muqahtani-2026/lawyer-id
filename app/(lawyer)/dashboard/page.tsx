import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getDashboardKPIs,
  getAgentStatus,
  getProfileCompletion,
  getRecentDrafts,
  getDraftsByDay,
  getDraftsByStatus,
} from "@/lib/queries/dashboard";
import {
  KpiCard,
  AgentStatusCard,
  ProfileCompletionCard,
  RecentDraftsList,
  TotalIcon,
  PendingIcon,
  CheckIcon,
  CalendarIcon,
} from "@/components/dashboard/widgets";
import { DraftsLineChart, DraftsDonutChart } from "@/components/dashboard/charts";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  // Fetch all dashboard data in parallel
  const [kpis, agent, completion, recentDrafts, draftsByDay, draftsByStatus] =
    await Promise.all([
      getDashboardKPIs(user.id),
      getAgentStatus(user.id),
      getProfileCompletion(user.id),
      getRecentDrafts(user.id, 3),
      getDraftsByDay(user.id, 7),
      getDraftsByStatus(user.id),
    ]);

  const displayName = profile?.full_name ?? "محامي";

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Welcome */}
      <header>
        <h1
          className="text-2xl md:text-3xl font-bold text-[#e6f1ff] mb-1"
          style={{ fontFamily: "'Readex Pro', system-ui, sans-serif" }}
        >
          أهلًا، {displayName}
        </h1>
        <p className="text-sm text-[#8892b0]">
          هذه لوحة التحكّم. من هنا تتابع مسوّداتك، حالة وكيل المحتوى، واكتمال مِلَفّك.
        </p>
      </header>

      {/* KPI Row */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="إجماليّ المسوّدات"
          value={kpis.totalDrafts}
          sublabel="منذ الانطلاق"
          icon={<TotalIcon />}
          variant="info"
        />
        <KpiCard
          label="بانتظار المراجعة"
          value={kpis.pendingDrafts}
          sublabel="تحتاج مراجعتك"
          icon={<PendingIcon />}
          variant="warning"
        />
        <KpiCard
          label="مقبولة اليوم"
          value={kpis.approvedToday}
          sublabel={`${kpis.approvedThisWeek} هذا الأسبوع`}
          icon={<CheckIcon />}
          variant="success"
        />
        <KpiCard
          label="إجماليّ المقبولة"
          value={kpis.approvedDrafts}
          sublabel="مسوّدات جاهزة للنشر"
          icon={<CalendarIcon />}
          variant="default"
        />
      </section>

      {/* Agent + Completion Row */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <AgentStatusCard status={agent} />
        </div>
        <div>
          <ProfileCompletionCard completion={completion} />
        </div>
      </section>

      {/* Charts Row */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="نشاط آخر 7 أيّام">
          <DraftsLineChart data={draftsByDay} />
        </ChartCard>
        <ChartCard title="توزيع المسوّدات حسب الحالة">
          <DraftsDonutChart data={draftsByStatus} />
        </ChartCard>
      </section>

      {/* Recent Drafts */}
      <section>
        <RecentDraftsList drafts={recentDrafts} />
      </section>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0f1f3d] border border-[#1d3461] rounded-lg p-5">
      <h3 className="text-sm font-medium text-[#e6f1ff] mb-4">{title}</h3>
      {children}
    </div>
  );
}
