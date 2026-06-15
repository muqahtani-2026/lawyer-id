import Link from "next/link";
import { ShareButton } from "@/components/public/ShareButton";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TierBadge } from "@/components/ui/badge";
import { ContactPanel } from "@/components/public/ContactPanel";
import { getArticleBySlug, getRelatedArticles, logEvent } from "@/lib/queries/public";

export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getArticleBySlug(decodeURIComponent(slug));
  if (!data) return { title: "مقال غير موجود" };
  const { article } = data;
  return {
    title: article.seo_title || article.title,
    description: article.seo_description || article.excerpt || undefined,
    openGraph: {
      title: article.seo_title || article.title,
      type: "article",
      images: article.og_image ? [article.og_image] : undefined,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getArticleBySlug(decodeURIComponent(slug));
  if (!data) notFound();
  const { article, author } = data;

  void logEvent("article", article.id, "view");

  const related = await getRelatedArticles(article.specialty_id ?? null, article.id, 3);
  const words = (article.body ?? "").trim().split(/\s+/).filter(Boolean).length;
  const readingMins = Math.max(1, Math.round(words / 200));
  const dateStr = article.published_at
    ? new Date(article.published_at).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt ?? undefined,
    datePublished: article.published_at ?? undefined,
    author: author ? { "@type": "Person", name: author.full_name } : undefined,
  };

  const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lawyer-id-tgi1.vercel.app";
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسة", item: BASE + "/" },
      { "@type": "ListItem", position: 2, name: "المقالات", item: BASE + "/articles" },
      { "@type": "ListItem", position: 3, name: article.title },
    ],
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <nav className="text-sm text-muted">
        <Link href="/" className="hover:text-content">الرئيسة</Link>
        <span className="mx-1">/</span>
        <Link href="/articles" className="hover:text-content">المقالات</Link>
      </nav>

      <div className="mt-4 flex justify-end"><ShareButton title={article.title} /></div>

      <article className="mt-4">
        <header>
          <h1 className="text-3xl font-bold leading-tight text-content">{article.title}</h1>
          {author && (
            <Link
              href={`/pros/${encodeURIComponent(author.slug ?? author.id)}`}
              className="mt-4 inline-flex items-center gap-2 text-sm"
            >
              <span className="font-medium text-content">{author.full_name}</span>
              <TierBadge tier={author.tier} />
            </Link>
          )}
          <div className="mt-2 text-sm text-muted">
            {dateStr && <span>{dateStr}</span>}
            {dateStr && <span className="mx-2">·</span>}
            <span>{readingMins} دقائق قراءة</span>
          </div>
        </header>

        <div className="mt-6 whitespace-pre-line text-lg leading-relaxed text-content/90">
          {article.body}
        </div>

        <p className="mt-8 rounded-lg border border-line bg-card p-4 text-xs text-muted">
          هذا المحتوى تعريفيٌّ عامّ وليس استشارةً قانونيّة أو مهنيّة. للحصول على رأيٍ مخصّص، تواصل مع
          الكاتب مباشرةً.
        </p>
      </article>

      {author && (
        <div className="mt-8 max-w-md">
          <ContactPanel
            professionalId={author.id}
            name={author.full_name ?? "الكاتب"}
            whatsapp={author.contact_whatsapp}
            phone={author.contact_phone}
            email={author.contact_email}
            formEnabled={author.contact_form_enabled}
            source="article"
            sourceArticleId={article.id}
          />
        </div>
      )}

      {related.length > 0 && (
        <section className="mt-12 border-t border-line pt-8">
          <h2 className="text-xl font-bold text-content">مقالات ذات صلة</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/articles/${encodeURIComponent(r.slug)}`}
                className="rounded-xl border border-line bg-card p-4 transition-colors hover:border-lawyer"
              >
                <div className="font-semibold leading-snug text-content line-clamp-2">{r.title}</div>
                {r.excerpt && <p className="mt-2 line-clamp-2 text-sm text-muted">{r.excerpt}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
