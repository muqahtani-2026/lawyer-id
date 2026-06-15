import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { Badge, TierBadge } from "@/components/ui/badge";
import {
  getFeaturedProfessionals,
  getPublishedArticles,
  getActiveFields,
} from "@/lib/queries/public";

export const revalidate = 300;

export default async function HomePage() {
  const [professionals, articles, fields] = await Promise.all([
    getFeaturedProfessionals(6),
    getPublishedArticles(6),
    getActiveFields(),
  ]);

  const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lawyer-id-tgi1.vercel.app";
  const siteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "لام",
    url: BASE,
    inLanguage: "ar",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: BASE + "/search?q={query}" },
      "query-input": "required name=query",
    },
  };
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "لام",
    url: BASE,
    description: "منصّة الحضور المهنيّ السعوديّة — اجعل خبرتك مرئيّة.",
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
      {/* Hero */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <Badge tone="lawyer" className="mb-5">منصّة الحضور المهنيّ</Badge>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight text-content sm:text-5xl">
            اجعل خبرتك مرئيّة
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">
            ابحث عن المختصّ المناسب — محامين ومستشارين وخبراء وأكاديميّين — اقرأ محتواهم،
            وتواصل معهم مباشرةً.
          </p>

          {/* Search box */}
          <form action="/search" className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row">
            <input
              name="q"
              placeholder="ابحث باسمٍ أو مجالٍ أو كلمة مفتاحيّة…"
              className="h-12 flex-1 rounded-lg border border-line bg-card px-4 text-content placeholder:text-muted focus:border-lawyer focus:outline-none"
            />
            <button type="submit" className={buttonClasses("primary", "lg")}>
              ابحث
            </button>
          </form>

          {/* Fields chips */}
          {fields.length > 0 && (
            <div className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-2">
              {fields.slice(0, 8).map((f) => (
                <Link
                  key={f.id}
                  href={`/fields/${encodeURIComponent(f.slug)}`}
                  className="rounded-full border border-line px-3 py-1 text-sm text-muted transition-colors hover:border-lawyer hover:text-content"
                >
                  {f.name_ar}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { n: "١", t: "ابحث", d: "اعثر على المختصّ حسب المجال والمدينة." },
            { n: "٢", t: "اقرأ وقارن", d: "اطّلع على محتواه وخبرته وملفّه المهنيّ." },
            { n: "٣", t: "تواصل", d: "تواصل معه مباشرةً عبر القناة المناسبة." },
          ].map((s) => (
            <div key={s.t} className="rounded-xl border border-line bg-card p-6">
              <div className="font-mono text-2xl text-lawyer">{s.n}</div>
              <div className="mt-2 text-lg font-semibold text-content">{s.t}</div>
              <p className="mt-1 text-sm text-muted">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured professionals */}
      {professionals.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-content">مهنيّون مميّزون</h2>
            <Link href="/search" className="text-sm text-lawyer hover:underline">عرض الكلّ</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {professionals.map((p) => (
              <Link
                key={p.id}
                href={`/pros/${encodeURIComponent(p.slug ?? p.id)}`}
                className="rounded-xl border border-line bg-card p-5 transition-colors hover:border-lawyer"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-content">{p.full_name}</div>
                  <TierBadge tier={p.tier} />
                </div>
                {p.headline && <p className="mt-1 line-clamp-2 text-sm text-muted">{p.headline}</p>}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.specialties?.slice(0, 2).map((s) => (
                    <Badge key={s.id} tone="neutral">{s.name}</Badge>
                  ))}
                  {p.city && <Badge tone="neutral">{p.city}</Badge>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Latest articles */}
      {articles.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-content">أحدث المقالات</h2>
            <Link href="/articles" className="text-sm text-lawyer hover:underline">عرض الكلّ</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <Link
                key={a.id}
                href={`/articles/${encodeURIComponent(a.slug)}`}
                className="rounded-xl border border-line bg-card p-5 transition-colors hover:border-lawyer"
              >
                {a.specialty_name && <Badge tone="lawyer" className="mb-2">{a.specialty_name}</Badge>}
                <div className="font-semibold leading-snug text-content line-clamp-2">{a.title}</div>
                {a.excerpt && <p className="mt-2 line-clamp-2 text-sm text-muted">{a.excerpt}</p>}
                <div className="mt-3 text-xs text-muted">{a.professional_name}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Why LAM for professionals */}
      <section className="border-y border-line bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-center text-2xl font-bold text-content">لماذا لام للمهنيّين؟</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { t: "حضور احترافيّ", d: "صفحة مهنيّة أنيقة تُبرز خبرتك ومجالك ومحتواك." },
              { t: "قابليّة الاكتشاف", d: "تظهر في البحث وصفحات المجالات والمدن لمن يبحث عن مختصّ." },
              { t: "نشر محتوى", d: "انشر مقالاتك على المنصّة بروابط مهيّأة لمحرّكات البحث." },
              { t: "طلبات تواصل", d: "استقبل طلبات التواصل مباشرةً عبر القناة التي تختارها." },
            ].map((v) => (
              <div key={v.t} className="rounded-xl border border-line bg-base p-5">
                <div className="text-lg font-semibold text-content">{v.t}</div>
                <p className="mt-1 text-sm text-muted">{v.d}</p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-muted">
            لام منصّة حضورٍ مهنيّ؛ لا تقدّم خدمات قانونيّة ولا استشارات، ولا تتدخّل في العلاقة بين المهنيّ وطالب الخدمة.
          </p>
        </div>
      </section>

      {/* CTA for professionals */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="rounded-2xl border border-line bg-gradient-to-l from-card to-elevated p-10 text-center">
          <h2 className="text-2xl font-bold text-content">هل أنت مهنيّ؟ اجعل خبرتك مرئيّة</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted">
            ابنِ حضورك الرقميّ، انشر محتواك، وكُن قابلًا للاكتشاف واستقبل طلبات التواصل.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/signup" className={buttonClasses("primary", "lg")}>ابدأ مجّانًا</Link>
            <Link href="/pricing" className={buttonClasses("outline", "lg")}>عرض الباقات</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
