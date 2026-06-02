import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function handleSignOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    profile?.full_name ?? user.email?.split("@")[0] ?? "محامي";

  return (
    <div className="min-h-screen bg-[#0a192f] text-[#e6f1ff]">
      {/* Header */}
      <header className="border-b border-[#1d3461] bg-[#0f1f3d]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-2 border-[#4a9eff] rounded-md flex items-center justify-center font-mono text-base font-bold text-[#4a9eff]">
              Li
            </div>
            <div>
              <div className="text-[#e6f1ff] text-base font-semibold leading-tight">
                Lawyer ID
              </div>
              <div className="text-[9px] text-[#8892b0] tracking-[1.5px] mt-0.5">
                SAUDI · LEGAL · COMMERCIAL
              </div>
            </div>
          </div>

          <form action={handleSignOut}>
            <button
              type="submit"
              className="text-sm text-[#8892b0] hover:text-[#ef4444] px-4 py-2 rounded-lg border border-[#1d3461] hover:border-[#ef4444]/50 transition-colors"
            >
              تسجيل الخروج ←
            </button>
          </form>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Welcome card */}
        <div className="bg-[#0f1f3d] border border-[#1d3461] rounded-xl p-8 mb-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 bg-[#4ade80]/10 border border-[#4ade80]/30 rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-7 h-7 text-[#4ade80]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">
                أهلًا، {displayName}
              </h1>
              <p className="text-[#8892b0] text-sm">
                سجّلتَ دخولًا بنجاح إلى منصّة Lawyer ID
              </p>
            </div>
          </div>

          <div className="grid gap-1 mt-8 pt-6 border-t border-[#1d3461]">
            <InfoRow label="البريد الإلكترونيّ" value={user.email ?? "—"} ltr />
            <InfoRow
              label="الاسم الكامل"
              value={profile?.full_name ?? "غير محدّد"}
            />
            <InfoRow label="معرّف المستخدم" value={user.id} ltr mono />
          </div>
        </div>

        {/* Placeholder notice */}
        <div className="bg-[#fbbf24]/5 border border-[#fbbf24]/30 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">🚧</span>
            <div>
              <h2 className="text-[#fbbf24] font-semibold mb-2">
                صفحة مؤقّتة
              </h2>
              <p className="text-[#8892b0] text-sm leading-relaxed">
                هذه الصفحة placeholder للتحقّق من نجاح المصادقة. الـ Dashboard
                الحقيقيّ — مع KPIs، حالة وكيل المحتوى، آخر المسوّدات، واكتمال
                المِلَفّ — سيُبنى في{" "}
                <span className="text-[#e6f1ff] font-medium">Phase 5.2</span>.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function InfoRow({
  label,
  value,
  ltr,
  mono,
}: {
  label: string;
  value: string;
  ltr?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-[#1d3461]/50 last:border-0">
      <span className="text-[#8892b0] text-sm flex-shrink-0">{label}</span>
      <span
        dir={ltr ? "ltr" : "rtl"}
        className={`text-[#e6f1ff] font-medium truncate ${
          mono ? "font-mono text-xs" : "text-sm"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
