import {
  listLegalCorpus,
  getCorpusFormOptions,
} from "@/lib/queries/admin-legal-corpus";
import { LegalCorpusList } from "@/components/admin/LegalCorpusList";

export default async function AdminLegalCorpusPage() {
  const [corpus, options] = await Promise.all([
    listLegalCorpus(),
    getCorpusFormOptions(),
  ]);

  const activeCount = corpus.filter((c) => c.is_active).length;

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto" style={{ direction: "rtl" }}>
      <header className="mb-10">
        <div className="flex items-baseline gap-3 mb-2">
          <span
            className="text-xs font-mono tracking-[2px]"
            style={{ color: "#fbbf24" }}
          >
            ADMIN · LEGAL CORPUS
          </span>
          <span className="text-xs font-mono tracking-wider text-[#8892b0]">
            {activeCount}/{corpus.length} نشطة
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          الأنظمة القانونيّة
        </h1>
        <p className="text-[#8892b0] leading-relaxed max-w-2xl">
          إدارة الأنظمة المرجعيّة التي يستخدمها وكيل المحتوى لتوليد المسوّدات.
          أيّ نظام غير نشط لا يدخل في التوليد.
        </p>
      </header>

      <LegalCorpusList corpus={corpus} options={options} />
    </div>
  );
}
