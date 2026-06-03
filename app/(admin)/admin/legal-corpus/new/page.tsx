import Link from "next/link";
import { getCorpusFormOptions } from "@/lib/queries/admin-legal-corpus";
import { LegalCorpusForm } from "@/components/admin/LegalCorpusForm";

export default async function NewLegalCorpusPage() {
  const options = await getCorpusFormOptions();

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
        <div className="flex items-baseline gap-3 mb-2">
          <span
            className="text-xs font-mono tracking-[2px]"
            style={{ color: "#fbbf24" }}
          >
            ADMIN · LEGAL CORPUS · NEW
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          إضافة نظام جديد
        </h1>
        <p className="text-[#8892b0] leading-relaxed">
          أدخل نظامًا مرجعيًّا جديدًا. الحقول المطلوبة عليها علامة <span style={{ color: "#fbbf24" }}>*</span>.
        </p>
      </header>

      <LegalCorpusForm options={options} mode="create" />
    </div>
  );
}
