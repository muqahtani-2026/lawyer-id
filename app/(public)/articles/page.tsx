import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { searchArticles } from "@/lib/queries/public";

export const metadata = { title: "المقالات" };
export const revalidate = 120;

const PAGE_SIZE = 12;

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const current = Math.max(1, parseInt(page ?? "1", 10) || 1);
  const all = await searchArticles();
  const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const safe = Math.min(current, totalPages);
  const articles = all.slice((safe - 1) * PAGE_SIZE, safe * PAGE_SIZE);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold text-content">المقالات</h1>
      <p className="mt-1 text-muted">محتوًى متخصّص بأقلام مهنيّين على لام.</p>

      {articles.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-line bg-card p-10 text-center text-muted">
          لا مقالات منشورة بعد.
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <Link
                key={a.id}
                href={`/articles/${encodeURIComponent(a.slug)}`}
                className="rounded-xl border border-line bg-card p-5 transition-colors hover:border-lawyer"
              >
                {a.specialty_name && <Badge tone="lawyer" className="mb-2">{a.specialty_name}</Badge>}
                <div className="font-semibold leading-snug text-content line-clamp-2">{a.title}</div>
                {a.excerpt && <p className="mt-2 line-clamp-3 text-sm text-muted">{a.excerpt}</p>}
                <div className="mt-3 text-xs text-muted">{a.professional_name}</div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-3 text-sm">
              {safe > 1 ? (
                <Link href={`/articles?page=${safe - 1}`} className="rounded-lg border border-line px-4 py-2 text-content hover:border-lawyer">
                  السابق
                </Link>
              ) : (
                <span className="rounded-lg border border-line px-4 py-2 text-muted opacity-50">السابق</span>
              )}
              <span className="font-mono text-muted">{safe} / {totalPages}</span>
              {safe < totalPages ? (
                <Link href={`/articles?page=${safe + 1}`} className="rounded-lg border border-line px-4 py-2 text-content hover:border-lawyer">
                  التالي
                </Link>
              ) : (
                <span className="rounded-lg border border-line px-4 py-2 text-muted opacity-50">التالي</span>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
