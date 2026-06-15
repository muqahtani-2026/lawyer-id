import { notFound } from "next/navigation";
import Link from "next/link";
import { getLawyerDetail } from "@/lib/queries/admin-lawyers";
import { AdminLawyerControls } from "@/components/admin/AdminLawyerControls";
import {
  ProfilePanel,
  NotificationPanel,
  SamplesPanel,
  DraftsPanel,
} from "@/components/admin/LawyerDetailPanels";

export default async function AdminLawyerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getLawyerDetail(id);

  if (!detail) {
    notFound();
  }

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto" style={{ direction: "rtl" }}>
      {/* Back link */}
      <Link
        href="/admin/lawyers"
        className="inline-flex items-center gap-2 text-xs font-mono tracking-wider text-[#8892b0] hover:text-[#fbbf24] transition-colors mb-6"
      >
        <span>←</span>
        <span>العودة لقائمة المحامين</span>
      </Link>

      {/* Header */}
      <header className="mb-10 pb-6 border-b border-[#1d3461]">
        <div className="flex items-baseline gap-3 mb-3">
          <span
            className="text-xs font-mono tracking-[2px]"
            style={{ color: "#fbbf24" }}
          >
            ADMIN · LAWYER
          </span>
          <span className="text-xs font-mono tracking-wider text-[#8892b0]">
            {id.slice(0, 8).toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <h1 className="text-3xl md:text-4xl font-bold">
            {detail.profile.full_name ?? "—"}
          </h1>
          {detail.profile.is_admin && (
            <span
              className="text-xs px-2.5 py-1 rounded font-mono font-bold tracking-wider"
              style={{ backgroundColor: "#fbbf24", color: "#0a192f" }}
            >
              ADMIN
            </span>
          )}
        </div>

        <p className="text-[#8892b0] font-mono text-sm">
          {detail.profile.email}
        </p>
        <p className="text-xs text-[#8892b0] mt-2">
          مُسجَّل منذ{" "}
          <span className="font-mono">
            {formatLongDate(detail.profile.created_at)}
          </span>
        </p>
      </header>

      {/* Profile + Notifications side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="mb-8">
          <AdminLawyerControls userId={detail.profile.id} isPublic={detail.profile.is_public} tier={detail.profile.tier} approvalStatus={detail.profile.approval_status} professionalKind={detail.profile.professional_kind} credentialDocPath={detail.profile.credential_doc_path} />
        </div>

        <ProfilePanel
          lawyer_profile={detail.lawyer_profile}
          specialties={detail.specialties}
        />
        <NotificationPanel prefs={detail.notification_prefs} />
      </div>

      {/* Samples (full width) */}
      <div className="mb-4">
        <SamplesPanel samples={detail.samples} />
      </div>

      {/* Drafts (full width) */}
      <DraftsPanel drafts={detail.recent_drafts} />
    </div>
  );
}

function formatLongDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
