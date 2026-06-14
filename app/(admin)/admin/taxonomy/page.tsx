import { getTaxonomy } from "@/lib/queries/admin-lam";
import { TaxonomyManager } from "@/components/admin/TaxonomyManager";

export const metadata = { title: "التصنيفات" };

export default async function AdminTaxonomyPage() {
  const fields = await getTaxonomy();
  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-content">التصنيفات والمجالات</h1>
      <p className="mt-1 text-sm text-muted">إدارة المجالات المهنيّة المستخدمة في البحث والاكتشاف وSEO.</p>
      <div className="mt-6">
        <TaxonomyManager initial={fields} />
      </div>
    </div>
  );
}
