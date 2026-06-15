import { getMyCorpusForStudio, getMyApprovalStatus } from "@/lib/queries/me";
import { StudioForm } from "@/components/dashboard/StudioForm";

export const metadata = { title: "استوديو المحتوى" };
export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const [sources, status] = await Promise.all([getMyCorpusForStudio(), getMyApprovalStatus()]);
  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-content">استوديو المحتوى</h1>
      <p className="mt-1 text-sm text-muted">اطلب توليد مسوّدة جديدة بأسلوبك من نظام في تخصّصك، واختر الصيغة والنبرة.</p>
      <div className="mt-6">
        <StudioForm sources={sources} locked={status !== "approved"} />
      </div>
    </div>
  );
}
