import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * /schedule — جدول النشر على X (ميزة Pro).
 * يعرض المسوّدات المجدوَلة غير المنشورة مرتّبةً بوقت النشر.
 * الإدارة (جدولة/إلغاء) من صفحة المسوّدة نفسها.
 */

export const dynamic = "force-dynamic";

function formatRiyadh(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ar", {
      calendar: "gregory",
      timeZone: "Asia/Riyadh",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleString();
  }
}

export default async function SchedulePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single();
  const isPro = profile?.tier === "pro";

  const { data: scheduled } = isPro
    ? await supabase
        .from("content_drafts")
        .select("id, draft_title, draft_content, scheduled_for")
        .eq("user_id", user.id)
        .not("scheduled_for", "is", null)
        .is("published_at", null)
        .order("scheduled_for", { ascending: true })
    : { data: null };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <header>
        <h1
          className="text-2xl md:text-3xl font-bold text-[#e6f1ff] mb-1"
          style={{ fontFamily: "'Readex Pro', system-ui, sans-serif" }}
        >
          جدول النشر
        </h1>
        <p className="text-sm text-[#8892b0]">
          مسوّداتك المجدوَلة للنشر التلقائيّ على X (توقيت الرياض).
        </p>
      </header>

      {!isPro ? (
        <div className="bg-[#0f1f3d] border border-[#1d3461] rounded-lg p-8 text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#152a4a]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="text-base text-[#e6f1ff] font-medium">جدولة النشر ميزة Pro</h2>
          <p className="text-sm text-[#8892b0] max-w-md mx-auto">
            مع Pro: انشر مسوّداتك على X فورًا أو جدولها بالوقت الذي تختار، مباشرةً من صفحة
            المراجعة.
          </p>
        </div>
      ) : !scheduled || scheduled.length === 0 ? (
        <div className="bg-[#0f1f3d] border border-[#1d3461] rounded-lg p-12 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#152a4a] mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4a9eff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <h3 className="text-base text-[#e6f1ff] font-medium mb-2">لا مسوّدات مجدوَلة</h3>
          <p className="text-sm text-[#8892b0] max-w-md mx-auto">
            من صفحة أيّ مسوّدة X مقبولة، اضغط «جدولة النشر» واختر الوقت — وستظهر هنا ثمّ تُنشر
            تلقائيًّا.
          </p>
          <Link
            href="/review?status=approved"
            className="inline-block mt-4 px-4 py-2 bg-[#4a9eff] hover:bg-[#3a8eef] text-white text-sm font-medium rounded-md transition-colors"
          >
            تصفّح المسوّدات المقبولة
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {scheduled.map((d) => (
            <li key={d.id}>
              <Link
                href={`/review/${d.id}`}
                className="block bg-[#0f1f3d] border border-[#1d3461] hover:border-[#4a9eff] rounded-lg p-4 transition-colors group"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base text-[#e6f1ff] group-hover:text-[#4a9eff] font-semibold leading-snug line-clamp-1 transition-colors">
                      {d.draft_title ?? "بدون عنوان"}
                    </h3>
                    <p className="text-sm text-[#8892b0] mt-1 line-clamp-2 leading-relaxed">
                      {d.draft_content}
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1.5 rounded border bg-[#152a4a] text-[#4a9eff] border-[#4a9eff]/30 whitespace-nowrap inline-flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {formatRiyadh(d.scheduled_for as string)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
