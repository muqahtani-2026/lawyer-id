import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge, TierBadge } from "@/components/ui/badge";
import {
  getFieldBySlug,
  searchProfessionals,
  searchArticles,
} from "@/lib/queries/public";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ field: string }>;
}): Promise<Metadata> {
  const { field } = await params;
  const f = await getFieldBySlug(decodeURIComponent(field));
  if (!f) return { title: "مجال غير موجود" };
  return {
    title: `${f.name_ar} — مهنيّون ومقالات`,
    description: f.description ?? `اكتشف المختصّين والمحتوى في مجال ${f.name_ar} على لام.`,
  };
}

export default async function FieldPage({
  params,
}: {
  params: Promise<{ field: string }>;
}) {
  const { field } = await params;
  const slug = decodeURIComponent(field);
  const f = await getFieldBySlug(slug);
  if (!f) notFound();

  const [pros, articles] = await Promise.all([
    searchProfessionals(undefined, undefined, slug),
    searchArticles(undefined, slug),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-content">{f.name_ar}</h1>
      {f.description && <p className="mt-2 max-w-2xl text-muted">{f.description}</p>}

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-content">مهنيّون في {f.name_ar}</h2>
        {pros.length === 0 ? (
          <p className="mt-2 text-sm text-muted">لا مهنيّون بعد في هذا المجال.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pros.map((p) => (
              <Link key={p.id} href={`/pros/${encodeURIComponent(p.slug ?? p.id)}`}
                className="rounded-xl border border-line bg-card p-5 transition-colors hover:border-lawyer">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-content">{p.full_name}</div>
                  <TierBadge tier={p.tier} />
                </div>
                {p.headline && <p className="mt-1 line-clamp-2 text-sm text-muted">{p.headline}</p>}
                {p.city && <div className="mt-2"><Badge tone="neutral">{p.city}</Badge></div>}
              </Link>
            ))}
          </div>
        )}
      </section>

      {articles.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-content">مقالات في {f.name_ar}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <Link key={a.id} href={`/articles/${encodeURIComponent(a.slug)}`}
                className="rounded-xl border border-line bg-card p-5 transition-colors hover:border-lawyer">
                <div className="font-semibold leading-snug text-content line-clamp-2">{a.title}</div>
                {a.excerpt && <p className="mt-2 line-clamp-2 text-sm text-muted">{a.excerpt}</p>}
                <div className="mt-3 text-xs text-muted">{a.professional_name}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
