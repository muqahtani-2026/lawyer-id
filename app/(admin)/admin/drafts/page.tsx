import {
  listAllDrafts,
  getDraftFilterOptions,
} from "@/lib/queries/admin-drafts";
import { DraftsManager } from "@/components/admin/DraftsManager";

export default async function AdminDraftsPage() {
  const [drafts, options] = await Promise.all([
    listAllDrafts(),
    getDraftFilterOptions(),
  ]);

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto" style={{ direction: "rtl" }}>
      <header className="mb-10">
        <div className="flex items-baseline gap-3 mb-2">
          <span
            className="text-xs font-mono tracking-[2px]"
            style={{ color: "#fbbf24" }}
          >
            ADMIN · DRAFTS
          </span>
          <span className="text-xs font-mono tracking-wider text-[#8892b0]">
            {drafts.length} مسوّدة
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">المسوّدات</h1>
        <p className="text-[#8892b0] leading-relaxed max-w-2xl">
          جميع المسوّدات التي أنتجها وكيل المحتوى لكلّ المحامين. استخدم
          الفلاتر للوصول السريع.
        </p>
      </header>

      <DraftsManager drafts={drafts} options={options} />
    </div>
  );
}
