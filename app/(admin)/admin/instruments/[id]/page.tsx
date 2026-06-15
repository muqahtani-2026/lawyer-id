import Link from "next/link";
import { notFound } from "next/navigation";
import { getInstrumentDetail } from "@/lib/queries/admin-instruments";
import { InstrumentTimeline } from "@/components/admin/InstrumentTimeline";

export const dynamic = "force-dynamic";

export default async function InstrumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getInstrumentDetail(id);
  if (!detail) notFound();

  return (
    <div className="p-6 md:p-8">
      <Link href="/admin/instruments" className="font-mono text-xs text-[#8892b0] hover:text-[#fbbf24]">
        ← العودة لقائمة الأنظمة
      </Link>

      <div className="mt-3 mb-1 flex items-baseline gap-3">
        <span className="font-mono text-xs tracking-[2px] text-[#fbbf24]">ADMIN · INSTRUMENT</span>
        <span className="font-mono text-xs text-[#8892b0]">{detail.events.length} حدثًا في التسلسل</span>
      </div>
      <h1 className="text-2xl font-bold text-content">{detail.canonical_title}</h1>
      {detail.summary && <p className="mt-1 max-w-3xl text-sm text-muted">{detail.summary}</p>}

      <div className="mt-6">
        <InstrumentTimeline detail={detail} />
      </div>
    </div>
  );
}
