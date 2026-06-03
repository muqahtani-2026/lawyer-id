import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getLegalCorpusDetail,
  getCorpusFormOptions,
} from "@/lib/queries/admin-legal-corpus";
import { LegalCorpusForm } from "@/components/admin/LegalCorpusForm";

export default async function EditLegalCorpusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [detail, options] = await Promise.all([
    getLegalCorpusDetail(id),
    getCorpusFormOptions(),
  ]);

  if (!detail) notFound();

  return (
    <div className="p-8 md:p-12 max-w-4xl mx-auto" style={{ direction: "rtl" }}>
      <Link
        href="/admin/legal-corpus"
        className="inline-flex items-center gap-2 text-xs font-mono tracking-wider text-[#8892b0] hover:text-[#fbbf24] mb-6 transition-colors"
      >
        <span>←</span>
        <span>العودة لقائمة الأنظمة</span>
      </Link>

      <header className="mb-8 pb-6 border-b border-[#1d3461]">
        <div className="flex items-baseline gap-3 mb-2 flex-wrap">
          <span
            className="text-xs font-mono tracking-[2px]"
            style={{ color: "#fbbf24" }}
          >
            ADMIN · LEGAL CORPUS · EDIT
          </span>
          <span className="text-xs font-mono tracking-wider text-[#8892b0]">
            {id.slice(0, 8).toUpperCase()}
          </span>
          <span
            className="text-[10px] px-2 py-0.5 rounded font-mono tracking-wider"
            style={
              detail.is_active
                ? { backgroundColor: "#4ade8020", color: "#4ade80" }
                : { backgroundColor: "#8892b020", color: "#8892b0" }
            }
          >
            {detail.is_active ? "نشط" : "مُعطَّل"}
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-snug">
          {detail.title}
        </h1>
        <div className="flex items-center gap-3 text-xs font-mono text-[#8892b0] flex-wrap">
          <span>{detail.drafts_count} مسوّدة مرتبطة</span>
          {detail.created_at && (
            <>
              <span>·</span>
              <span>أُنشئ {formatDate(detail.created_at)}</span>
            </>
          )}
          {detail.updated_at && detail.updated_at !== detail.created_at && (
            <>
              <span>·</span>
              <span>آخر تعديل {formatDate(detail.updated_at)}</span>
            </>
          )}
        </div>
      </header>

      <LegalCorpusForm initial={detail} options={options} mode="edit" />
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
