import Link from "next/link";
import { listL3Instruments, getL3Counts } from "@/lib/queries/admin-l3";

export const metadata = { title: "الأنظمة والتسلسل الزمنيّ" };
export const dynamic = "force-dynamic";

const DOMAIN_COLOR: Record<string, string> = {
  "تجاري": "#fbbf24",
  "عمالي": "#60a5fa",
  "جزائي": "#f87171",
  "قضائي": "#a78bfa",
  "عقاري": "#34d399",
  "عام": "#8892b0",
};

export default async function AdminInstrumentsPage() {
  const [rows, counts] = await Promise.all([listL3Instruments(), getL3Counts()]);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-2 flex items-baseline gap-3">
        <span className="font-mono text-xs tracking-[2px] text-[#fbbf24]">ADMIN · INSTRUMENTS</span>
        <span className="font-mono text-xs text-[#8892b0]">
          {counts.instruments} نظامًا · {counts.links} رابطًا
        </span>
      </div>
      <h1 className="text-2xl font-bold text-content">الأنظمة واللوائح وتسلسلها الزمنيّ</h1>
      <p className="mt-1 max-w-3xl text-sm text-muted">
        كلّ نظام مع تسلسله الزمنيّ الكامل (من أوّل صدور إلى أحدث تعديل). افتح أيّ نظام لعرض
        تسلسل تعديلاته، وكلّ تعديل يذكر رقم العدد وتاريخه ورقم القرار/المرسوم.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => (
          <Link
            key={r.id}
            href={`/admin/instruments/${r.id}`}
            className="group rounded-xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-[#fbbf24]/40 hover:bg-white/[0.04]"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-base font-semibold text-content group-hover:text-[#fbbf24]">
                {r.canonical_name}
              </h2>
              {r.is_commercial && (
                <span className="shrink-0 rounded bg-[#fbbf24]/15 px-2 py-0.5 font-mono text-[10px] text-[#fbbf24]">
                  تجاري
                </span>
              )}
            </div>
            <div className="mt-3 flex items-center gap-3 font-mono text-xs text-[#8892b0]">
              <span style={{ color: DOMAIN_COLOR[r.domain ?? "عام"] ?? "#8892b0" }}>
                {r.domain ?? "عام"}
              </span>
              <span>·</span>
              <span>{r.event_count} حدثًا</span>
              {r.is_repealed && <span className="text-[#f87171]">· مُلغى</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
