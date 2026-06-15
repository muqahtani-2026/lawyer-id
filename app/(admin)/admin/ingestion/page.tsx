import { getIngestQueue, getIngestCounts, getTaxonomy } from "@/lib/queries/admin-lam";
import { IngestionQueue } from "@/components/admin/IngestionQueue";

export const metadata = { title: "جلب الأنظمة" };
export const dynamic = "force-dynamic";

export default async function AdminIngestionPage() {
  const [queue, counts, taxonomy] = await Promise.all([getIngestQueue("pending"), getIngestCounts(), getTaxonomy()]);
  const fields = (taxonomy as { id: string; name_ar: string; is_active: boolean }[])
    .filter((f) => f.is_active)
    .map((f) => ({ id: f.id, name_ar: f.name_ar }));

  return (
    <div className="p-6 md:p-8">
      <div className="mb-2 flex items-baseline gap-3">
        <span className="font-mono text-xs tracking-[2px] text-[#fbbf24]">ADMIN · INGESTION</span>
        <span className="font-mono text-xs text-[#8892b0]">
          {counts.pending} بانتظار · {counts.imported} مستورد · {counts.rejected} مرفوض
        </span>
      </div>
      <h1 className="text-2xl font-bold text-content">جلب الأنظمة واللوائح</h1>
      <p className="mt-1 max-w-3xl text-sm text-muted">
        جلب تلقائيّ من المصادر الرسميّة (هيئة الخبراء، أم القرى، ومواقع <span className="font-mono" dir="ltr">*.gov.sa</span> فقط).
        راجع كلّ عنصر، عيّن تخصّصه، ثمّ استورده إلى مكتبة الأنظمة لتُستخدم في توليد المحتوى. يعمل الجلب تلقائيًّا يوميًّا، أو يدويًّا بالزرّ أدناه.
      </p>
      <div className="mt-6">
        <IngestionQueue initial={queue as never} fields={fields} />
      </div>
    </div>
  );
}
