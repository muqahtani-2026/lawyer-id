import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { Badge, TierBadge } from "@/components/ui/badge";
import {
  searchProfessionals,
  searchArticles,
  getActiveFields,
} from "@/lib/queries/public";

export const metadata = { title: "ابحث عن مختصّ" };
export const revalidate = 60;

type SP = { [key: string]: string | string[] | undefined };

function first(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const q = first(sp.q);
  const city = first(sp.city);
  const field = first(sp.field);
  const type = first(sp.type) === "articles" ? "articles" : "pros";
  const lang = first(sp.lang);
  const sort = first(sp.sort) || "relevance";

  const fields = await getActiveFields();
  let pros = type === "pros" ? await searchProfessionals(q, city, field) : [];
  if (type === "pros" && lang) {
    const want = lang === "en" ? ["en", "إنج", "انج", "english"] : ["ar", "عرب", "arabic"];
    pros = pros.filter((p) => {
      const joined = (p.languages ?? []).join(" ").toLowerCase();
      return want.some((w) => joined.includes(w));
    });
  }
  if (type === "pros") {
    if (sort === "experience") pros = [...pros].sort((a, b) => (b.years_experience ?? 0) - (a.years_experience ?? 0));
    else if (sort === "content") pros = [...pros].sort((a, b) => (b.article_count ?? 0) - (a.article_count ?? 0));
  }
  const articles = type === "articles" ? await searchArticles(q, field) : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold text-content">ابحث عن مختصّ</h1>

      {/* Filters (GET form) */}
      <form action="/search" className="mt-5 grid gap-3 rounded-xl border border-line bg-card p-4 sm:grid-cols-4">
        <input type="hidden" name="type" value={type} />
        <input
          name="q"
          defaultValue={q}
          placeholder="بحث…"
          className="h-10 rounded-lg border border-line bg-base px-3 text-content placeholder:text-muted focus:border-lawyer focus:outline-none sm:col-span-2"
        />
        <select
          name="field"
          defaultValue={field}
          className="h-10 rounded-lg border border-line bg-base px-3 text-content focus:border-lawyer focus:outline-none"
        >
          <option value="">كلّ المجالات</option>
          {fields.map((f) => (
            <option key={f.id} value={f.slug}>{f.name_ar}</option>
          ))}
        </select>
        <input
          name="city"
          defaultValue={city}
          placeholder="المدينة"
          className="h-10 rounded-lg border border-line bg-base px-3 text-content placeholder:text-muted focus:border-lawyer focus:outline-none"
        />
        <select
          name="lang"
          defaultValue={lang}
          className="h-10 rounded-lg border border-line bg-base px-3 text-content focus:border-lawyer focus:outline-none"
        >
          <option value="">كلّ اللغات</option>
          <option value="ar">العربيّة</option>
          <option value="en">الإنجليزيّة</option>
        </select>
        <select
          name="sort"
          defaultValue={sort}
          className="h-10 rounded-lg border border-line bg-base px-3 text-content focus:border-lawyer focus:outline-none"
        >
          <option value="relevance">الأكثر صلة</option>
          <option value="experience">الأكثر خبرة</option>
          <option value="content">الأكثر محتوًى</option>
        </select>
        <button type="submit" className={buttonClasses("primary", "md", "sm:col-span-2")}>
          تطبيق البحث
        </button>
      </form>

      {/* Tabs */}
      <div className="mt-6 flex gap-2 border-b border-line">
        <Link
          href={`/search?type=pros&q=${encodeURIComponent(q)}&field=${field}&city=${encodeURIComponent(city)}`}
          className={`border-b-2 px-3 py-2 text-sm ${type === "pros" ? "border-lawyer text-content" : "border-transparent text-muted"}`}
        >
          المهنيّون
        </Link>
        <Link
          href={`/search?type=articles&q=${encodeURIComponent(q)}&field=${field}`}
          className={`border-b-2 px-3 py-2 text-sm ${type === "articles" ? "border-lawyer text-content" : "border-transparent text-muted"}`}
        >
          المقالات
        </Link>
      </div>

      {/* Results */}
      <div className="mt-6">
        {type === "pros" ? (
          pros.length === 0 ? (
            <Empty />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pros.map((p) => (
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
                  <div className="mt-3 flex gap-3 text-xs text-muted">
                    {typeof p.years_experience === "number" && p.years_experience > 0 && (
                      <span>{p.years_experience} سنوات خبرة</span>
                    )}
                    <span>{p.article_count} مقالات</span>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : articles.length === 0 ? (
          <Empty />
        ) : (
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
        )}
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="rounded-xl border border-dashed border-line bg-card p-10 text-center">
      <p className="text-content">لا نتائج مطابقة.</p>
      <p className="mt-1 text-sm text-muted">جرّب توسيع البحث أو إزالة بعض الفلاتر.</p>
    </div>
  );
}
