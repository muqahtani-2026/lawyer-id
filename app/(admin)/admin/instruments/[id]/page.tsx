import Link from "next/link";
import { notFound } from "next/navigation";
import { getL3InstrumentDetail } from "@/lib/queries/admin-l3";
import { L3InstrumentView } from "@/components/admin/L3InstrumentView";

export const dynamic = "force-dynamic";

const DOMAIN_LABEL: Record<string, string> = {
  "تجاري": "تجاريّ", "عمالي": "عمّاليّ", "جزائي": "جزائيّ",
  "قضائي": "قضائيّ", "عقاري": "عقاريّ", "عام": "عامّ",
};

export default async function InstrumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getL3InstrumentDetail(id);
  if (!detail) notFound();

  return (
    <div className="p-6 md:p-8">
      <Link href="/admin/instruments" className="font-mono text-xs text-[#8892b0] hover:text-[#fbbf24]">
        ← العودة لقائمة الأنظمة
      </Link>

      <div className="mt-3 mb-1 flex items-baseline gap-3">
        <span className="font-mono text-xs tracking-[2px] text-[#fbbf24]">ADMIN · INSTRUMENT</span>
        <span className="font-mono text-xs text-[#8892b0]">
          {detail.events.length} حدثًا · {DOMAIN_LABEL[detail.domain ?? "عام"] ?? "عامّ"}
          {detail.is_commercial ? " · ضمن النطاق التجاريّ" : ""}
        </span>
      </div>
      <h1 className="text-2xl font-bold text-content">{detail.canonical_name}</h1>

      <div className="mt-6">
        <L3InstrumentView detail={detail} />
      </div>
    </div>
  );
}
