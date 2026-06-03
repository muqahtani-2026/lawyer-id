import { createClient } from "@/lib/supabase/server";

export default async function AdminOverviewPage() {
  // Quick smoke test: count profiles (admin can see all via RLS extension)
  const supabase = await createClient();
  const { count: lawyerCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });
  const { count: draftCount } = await supabase
    .from("content_drafts")
    .select("*", { count: "exact", head: true });

  return (
    <div className="p-8 md:p-12 max-w-6xl mx-auto" style={{ direction: "rtl" }}>
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
            Phase 6.1.a
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          نَظْرة عامّة على المنصّة
        </h1>
        <p className="text-[#8892b0] leading-relaxed max-w-2xl">
          مرحبًا بك في لوحة الإدارة. الـ KPIs الكاملة والرسوم البيانية قادمة في
          Phase 6.1.b. هذه صفحة تأكيد لعمل الـ route protection.
        </p>
      </header>

      {/* Smoke-test KPIs (quick counters to verify admin RLS access) */}
      <section
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10"
        aria-label="Smoke test counters"
      >
        <div className="bg-[#0f1f3d] border border-[#1d3461] rounded-xl p-6">
          <div
            className="text-xs font-mono tracking-wider mb-2"
            style={{ color: "#fbbf24" }}
          >
            TOTAL LAWYERS
          </div>
          <div className="text-4xl font-bold font-mono">
            {lawyerCount ?? "—"}
          </div>
          <div className="text-xs text-[#8892b0] mt-2">
            (يقرأ كلّ الـ profiles عبر admin RLS)
          </div>
        </div>

        <div className="bg-[#0f1f3d] border border-[#1d3461] rounded-xl p-6">
          <div
            className="text-xs font-mono tracking-wider mb-2"
            style={{ color: "#fbbf24" }}
          >
            TOTAL DRAFTS
          </div>
          <div className="text-4xl font-bold font-mono">
            {draftCount ?? "—"}
          </div>
          <div className="text-xs text-[#8892b0] mt-2">
            (يقرأ كلّ الـ content_drafts عبر admin RLS)
          </div>
        </div>
      </section>

      {/* What's next */}
      <section className="bg-[#0f1f3d] border border-[#1d3461] rounded-xl p-6 md:p-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: "#fbbf24" }}
          />
          ما القادم في Phase 6.1.b
        </h2>
        <ul className="space-y-2 text-sm text-[#8892b0] leading-relaxed">
          <li>• 6 KPI cards: محامون، مسوّدات (pending/approved/published)، quality avg.</li>
          <li>• رسم خطّي: مسوّدات يوميًّا (آخر 7 أيّام).</li>
          <li>• رسم دائريّ: top 5 محامين حسب عدد المسوّدات.</li>
          <li>• Activity feed: آخر 10 أحداث على المنصّة.</li>
        </ul>
      </section>
    </div>
  );
}
