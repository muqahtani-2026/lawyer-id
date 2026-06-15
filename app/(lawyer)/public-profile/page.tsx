import Link from "next/link";
import { getMyPublicProfile } from "@/lib/queries/me";
import { PublicProfileForm } from "@/components/dashboard/PublicProfileForm";

export const metadata = { title: "ملفي العام" };

export default async function PublicProfilePage() {
  const profile = await getMyPublicProfile();
  const approved = profile?.approval_status === "approved";

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content">ملفي العام</h1>
          <p className="mt-1 text-sm text-muted">
            هذا ما يراه الجمهور عنك. (ميزة Premium — يظهر في البحث عند التفعيل.)
          </p>
        </div>
        {profile?.is_public && profile.slug && (
          <Link href={`/pros/${profile.slug}`} target="_blank" className="text-sm text-lawyer hover:underline">
            عرض ملفي العام ↗
          </Link>
        )}
      </div>

      {profile && !approved && (
        <div className={`mb-6 rounded-xl border p-4 text-sm ${profile.approval_status === "rejected" ? "border-danger/40 bg-danger/5 text-content" : "border-warning/40 bg-warning/5 text-content"}`}>
          {profile.approval_status === "rejected"
            ? "تعذّر اعتماد طلبك. يُرجى التواصل مع الإدارة أو إعادة رفع وثيقة صحيحة."
            : "حسابك بانتظار مراجعة الوثيقة واعتمادها. لا يمكن تفعيل الظهور العام حتّى يُعتمد طلبك."}
        </div>
      )}

      {profile ? (
        <PublicProfileForm initial={profile} locked={!approved} />
      ) : (
        <p className="text-muted">تعذّر تحميل الملف.</p>
      )}
    </div>
  );
}
