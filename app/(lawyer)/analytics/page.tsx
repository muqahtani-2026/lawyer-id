import { getMyStats } from "@/lib/queries/me";

export const metadata = { title: "الإحصاءات" };

const cards: { key: string; label: string; accent: string }[] = [
  { key: "profile_views", label: "مشاهدات الملف", accent: "text-lawyer" },
  { key: "article_views", label: "مشاهدات المقالات", accent: "text-lawyer" },
  { key: "published_articles", label: "مقالات منشورة", accent: "text-content" },
  { key: "leads_total", label: "طلبات التواصل", accent: "text-premium" },
  { key: "leads_new", label: "طلبات جديدة", accent: "text-warning" },
  { key: "contact_clicks", label: "نقرات التواصل", accent: "text-success" },
  { key: "answers_published", label: "إجابات منشورة", accent: "text-content" },
  { key: "questions_pending", label: "إجابات بانتظار الإشراف", accent: "text-warning" },
];

export default async function AnalyticsPage() {
  const stats = await getMyStats();

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-content">الإحصاءات</h1>
      <p className="mt-1 text-sm text-muted">أداء حضورك المهنيّ على لام.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.key} className="rounded-xl border border-line bg-card p-5">
            <div className={`font-mono text-3xl font-bold ${c.accent}`}>{stats[c.key] ?? 0}</div>
            <div className="mt-1 text-sm text-muted">{c.label}</div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-muted">
        الإحصاءات المتقدّمة (الاتجاهات والمصادر) ضمن باقة Premium.
      </p>
    </div>
  );
}
