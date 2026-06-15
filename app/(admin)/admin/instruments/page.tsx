import { listInstruments, getInstrumentFilterOptions, getInstrumentCounts } from "@/lib/queries/admin-instruments";
import { InstrumentsBrowser } from "@/components/admin/InstrumentsBrowser";

export const metadata = { title: "الأنظمة والتسلسل الزمنيّ" };
export const dynamic = "force-dynamic";

export default async function AdminInstrumentsPage() {
  const [rows, options, counts] = await Promise.all([
    listInstruments(),
    getInstrumentFilterOptions(),
    getInstrumentCounts(),
  ]);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-2 flex items-baseline gap-3">
        <span className="font-mono text-xs tracking-[2px] text-[#fbbf24]">ADMIN · INSTRUMENTS</span>
        <span className="font-mono text-xs text-[#8892b0]">
          {counts.instruments} نظام · {counts.events} حدثًا · {counts.gazette} عدد أم القرى
          {counts.pending > 0 ? ` · ${counts.pending} بانتظار تأكيد الربط` : ""}
        </span>
      </div>
      <h1 className="text-2xl font-bold text-content">الأنظمة واللوائح وتسلسلها الزمنيّ</h1>
      <p className="mt-1 max-w-3xl text-sm text-muted">
        كلّ نظام أو لائحة مع تسلسله الزمنيّ الكامل (من أوّل صدور إلى أحدث تعديل، مرتّبًا الأقدم → الأحدث).
        النصوص مخزّنة حرفيًّا دون أيّ تعديل. افتح أيّ نظام لعرض تسلسله، وتحميله أو نسخه في ملفّ مستقلّ.
      </p>
      <div className="mt-6">
        <InstrumentsBrowser rows={rows} specialties={options.specialties} />
      </div>
    </div>
  );
}
