import { getPendingProfessionals } from "@/lib/queries/admin-lam";
import { ApprovalQueue } from "@/components/admin/ApprovalQueue";

export const metadata = { title: "اعتماد المهنيّين" };
export const dynamic = "force-dynamic";

export default async function AdminApprovalsPage() {
  const pending = await getPendingProfessionals();
  return (
    <div className="p-6 md:p-8">
      <div className="mb-2 flex items-baseline gap-3">
        <span className="font-mono text-xs tracking-[2px] text-[#fbbf24]">ADMIN · APPROVALS</span>
        <span className="font-mono text-xs text-[#8892b0]">{pending.length} بانتظار</span>
      </div>
      <h1 className="text-2xl font-bold text-content">اعتماد المهنيّين</h1>
      <p className="mt-1 text-sm text-muted">راجع وثيقة كلّ طلب (الرخصة / التدريب / الوثيقة القانونيّة) قبل اعتماده. لا يظهر أيّ ملف للعامّة قبل الاعتماد.</p>
      <div className="mt-6">
        <ApprovalQueue initial={pending as never} />
      </div>
    </div>
  );
}
