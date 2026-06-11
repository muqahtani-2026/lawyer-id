import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SchedulePlanner from "@/components/schedule/SchedulePlanner";

/**
 * /schedule — مخطّط النشر الدفعيّ على X (ميزة Pro).
 * يعرض المسوّدات المقبولة (x_short) غير المنشورة، ويتيح توزيعها على مدى 30 يومًا.
 */

export const dynamic = "force-dynamic";

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

  // ساعة التسجيل المفضّلة (للتوزيع التلقائيّ الافتراضيّ)
  const { data: np } = await supabase
    .from("notification_preferences")
    .select("preferred_send_hour")
    .eq("user_id", user.id)
    .maybeSingle();
  const preferredHour =
    typeof np?.preferred_send_hour === "number" ? np.preferred_send_hour : 8;

  // كلّ مسوّدات X القصيرة المقبولة غير المنشورة (مجدوَلة أو لا)
  const { data: drafts } = isPro
    ? await supabase
        .from("content_drafts")
        .select("id, draft_title, draft_content, scheduled_for, content_format, status")
        .eq("user_id", user.id)
        .eq("content_format", "x_short")
        .eq("status", "approved")
        .is("published_at", null)
        .order("scheduled_for", { ascending: true, nullsFirst: false })
        .order("generated_at", { ascending: true })
    : { data: null };

  if (!isPro) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
        <header>
          <h1
            className="text-2xl md:text-3xl font-bold text-[#e6f1ff] mb-1"
            style={{ fontFamily: "'Readex Pro', system-ui, sans-serif" }}
          >
            جدول النشر
          </h1>
          <p className="text-sm text-[#8892b0]">جدولة النشر التلقائيّ على X.</p>
        </header>
        <div className="bg-[#0f1f3d] border border-[#1d3461] rounded-lg p-8 text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#152a4a]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="text-base text-[#e6f1ff] font-medium">جدولة النشر ميزة Pro</h2>
          <p className="text-sm text-[#8892b0] max-w-md mx-auto">
            مع Pro تحصل على 30 مسوّدة جاهزة، وتوزّعها للنشر التلقائيّ على X خلال 30 يومًا
            القادمة بضغطة واحدة.
          </p>
          <a
            href="/upgrade"
            className="inline-block mt-2 px-4 py-2 bg-[#a855f7] hover:bg-[#9333ea] text-white text-sm font-medium rounded-md transition-colors"
          >
            الترقية إلى Pro
          </a>
        </div>
      </div>
    );
  }

  return (
    <SchedulePlanner
      preferredHour={preferredHour}
      initialDrafts={(drafts ?? []).map((d) => ({
        id: d.id,
        title: d.draft_title ?? "بدون عنوان",
        content: d.draft_content ?? "",
        scheduled_for: (d.scheduled_for as string | null) ?? null,
      }))}
    />
  );
}
