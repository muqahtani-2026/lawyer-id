import Link from "next/link";
import { getMyStats, getMyPublicProfile } from "@/lib/queries/me";

export async function LamPresenceStrip() {
  const [stats, profile] = await Promise.all([getMyStats(), getMyPublicProfile()]);
  const cards: { key: string; label: string; href: string; accent: string }[] = [
    { key: "profile_views", label: "مشاهدات الملف", href: "/analytics", accent: "text-lawyer" },
    { key: "article_views", label: "مشاهدات المقالات", href: "/my-articles", accent: "text-lawyer" },
    { key: "published_articles", label: "مقالات منشورة", href: "/my-articles", accent: "text-content" },
    { key: "leads_new", label: "طلبات جديدة", href: "/leads", accent: "text-premium" },
    { key: "questions_pending", label: "بانتظار إجابتك", href: "/inbox", accent: "text-warning" },
    { key: "contact_clicks", label: "نقرات التواصل", href: "/analytics", accent: "text-success" },
  ];

  const isPublic = profile?.is_public;

  return (
    <section aria-label="حضوري على لام" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-mono tracking-[2px] text-lawyer">LAM · حضوري المهنيّ</h2>
        {isPublic && profile?.slug ? (
          <Link href={`/pros/${profile.slug}`} target="_blank" className="text-xs text-lawyer hover:underline">
            عرض ملفي العام ↗
          </Link>
        ) : (
          <Link href="/public-profile" className="text-xs text-premium hover:underline">
            فعّل ملفك العام ←
          </Link>
        )}
      </div>

      {!isPublic && (
        <div className="rounded-xl border border-premium/40 bg-premium/5 p-4 text-sm text-content">
          ملفك العام غير مُفعّل بعد — فعّله من «ملفي العام» لتظهر في البحث وتستقبل طلبات التواصل.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <Link
            key={c.key}
            href={c.href}
            className="rounded-xl border border-[#1d3461] bg-[#0f1f3d] p-4 transition-colors hover:border-[#4a9eff]/40"
          >
            <div className={`font-mono text-2xl font-bold ${c.accent}`}>{stats[c.key] ?? 0}</div>
            <div className="mt-1 text-xs text-[#8892b0]">{c.label}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
