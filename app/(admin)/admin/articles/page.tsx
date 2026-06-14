import { getArticlesForModeration } from "@/lib/queries/admin-lam";
import { ArticleModeration } from "@/components/admin/LamModeration";

export const metadata = { title: "إشراف المقالات" };

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = status || "pending";
  const articles = await getArticlesForModeration(filter === "all" ? undefined : filter);

  const tabs = [
    { key: "pending", label: "بانتظار الإشراف" },
    { key: "published", label: "منشورة" },
    { key: "all", label: "الكلّ" },
  ];

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-content">إشراف المقالات</h1>
      <div className="mt-4 flex gap-2 border-b border-line">
        {tabs.map((t) => (
          <a key={t.key} href={`/admin/articles?status=${t.key}`}
            className={`border-b-2 px-3 py-2 text-sm ${filter === t.key ? "border-admin text-content" : "border-transparent text-muted"}`}>
            {t.label}
          </a>
        ))}
      </div>

      {articles.length === 0 ? (
        <p className="mt-6 text-muted">لا مقالات في هذه القائمة.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {articles.map((a) => (
            <div key={a.id} className="rounded-xl border border-line bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-content">{a.title}</div>
                  <div className="mt-0.5 text-xs text-muted">بقلم {a.author_name}</div>
                </div>
                <ArticleModeration id={a.id} status={a.status} />
              </div>
              {a.excerpt && <p className="mt-3 text-sm text-muted">{a.excerpt}</p>}
              <details className="mt-3">
                <summary className="cursor-pointer text-sm text-admin">عرض المحتوى الكامل</summary>
                <div className="mt-2 whitespace-pre-line border-t border-line pt-3 text-sm text-content/90">{a.body}</div>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
