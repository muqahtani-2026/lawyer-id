import Link from "next/link";
import { getMyArticles, getPublishableDrafts } from "@/lib/queries/me";
import { PublishDraftButton, ArticleStatusControl } from "@/components/dashboard/MeControls";

export const metadata = { title: "مقالاتي" };

export default async function MyArticlesPage() {
  const [articles, drafts] = await Promise.all([getMyArticles(), getPublishableDrafts()]);

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-content">مقالاتي</h1>
      <p className="mt-1 text-sm text-muted">انشر مسوّداتك المعتمدة كمقالاتٍ عامّة (بعد إشراف الإدارة).</p>

      {/* Publishable drafts */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-content">مسوّدات جاهزة للنشر</h2>
        {drafts.length === 0 ? (
          <p className="mt-2 text-sm text-muted">لا مسوّدات جديدة. أنشئ محتوًى من «المحتوى».</p>
        ) : (
          <div className="mt-3 space-y-2">
            {drafts.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-card p-4">
                <div className="min-w-0">
                  <div className="truncate font-medium text-content">{d.draft_title ?? "بدون عنوان"}</div>
                  {d.draft_summary && <div className="truncate text-sm text-muted">{d.draft_summary}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/article-editor?draft=${d.id}`} className="text-xs text-lawyer hover:underline">تحرير ونشر</Link>
                  <PublishDraftButton draftId={d.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Articles */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-content">المنشورة وقيد الإشراف</h2>
        {articles.length === 0 ? (
          <p className="mt-2 text-sm text-muted">لا مقالات بعد.</p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead className="bg-elevated text-right text-muted">
                <tr>
                  <th className="p-3 font-medium">العنوان</th>
                  <th className="p-3 font-medium">المشاهدات</th>
                  <th className="p-3 font-medium">الحالة</th>
                  <th className="p-3 font-medium">تحرير</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((a) => (
                  <tr key={a.id} className="border-t border-line bg-card">
                    <td className="p-3 text-content">{a.title}</td>
                    <td className="p-3 font-mono text-muted">{a.views_count ?? 0}</td>
                    <td className="p-3"><ArticleStatusControl id={a.id} status={a.status} /></td>
                    <td className="p-3"><Link href={`/article-editor?article=${a.id}`} className="text-sm text-lawyer hover:underline">تحرير</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
