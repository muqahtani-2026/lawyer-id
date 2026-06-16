import { getGazetteOverview, listGazetteIssues } from "@/lib/queries/admin-gazette";
import { GazetteProcessor } from "@/components/admin/GazetteProcessor";

export const metadata = { title: "معالجة أم القرى" };
export const dynamic = "force-dynamic";

export default async function AdminGazettePage() {
  const [ov, issues] = await Promise.all([getGazetteOverview(), listGazetteIssues()]);

  const stat = (label: string, value: number, color: string) => (
    <div className="rounded-xl border border-[#1d3461] bg-[#0f1f3d] p-4">
      <div className="font-mono text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="mt-1 text-xs text-[#8892b0]">{label}</div>
    </div>
  );

  return (
    <div className="p-6 md:p-8">
      <div className="mb-2 flex items-baseline gap-3">
        <span className="font-mono text-xs tracking-[2px] text-[#fbbf24]">ADMIN · GAZETTE</span>
      </div>
      <h1 className="text-2xl font-bold text-content">معالجة أعداد أم القرى</h1>
      <p className="mt-1 max-w-3xl text-sm text-muted">
        استخلاص آليّ للنصّ الحرفيّ من كلّ عدد، وفصل القرارات والمراسيم واللوائح عن الأخبار،
        واستنتاج كلّ نظام وربطه بتسلسله الزمنيّ. النصوص تُخزّن كما هي دون تعديل حرف.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {stat("إجمالي الأعداد", ov.total, "#e6f1ff")}
        {stat("بانتظار", ov.pending, "#8892b0")}
        {stat("مُحلّل", ov.parsed, "#4ade80")}
        {stat("مراجعة", ov.review, "#fbbf24")}
        {stat("يحتاج OCR", ov.needs_ocr, "#a855f7")}
        {stat("فشل", ov.failed, "#ef4444")}
        {stat("أنظمة مستنتَجة", ov.instruments, "#4a9eff")}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-2">
        {stat("أحداث مسجّلة (نصّ حرفيّ)", ov.events, "#4a9eff")}
        {stat("بانتظار تأكيد الربط", ov.pending_links, "#fbbf24")}
      </div>

      <div className="mt-8">
        <GazetteProcessor initialPending={ov.pending} issues={issues} />
      </div>
    </div>
  );
}
