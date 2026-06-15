import Link from "next/link";
import { ShareButton } from "@/components/public/ShareButton";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge, TierBadge } from "@/components/ui/badge";
import { ContactPanel } from "@/components/public/ContactPanel";
import {
  getProfessionalBySlug,
  getArticlesByProfessional,
  logEvent,
} from "@/lib/queries/public";

export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProfessionalBySlug(decodeURIComponent(slug));
  if (!p) return { title: "ملف غير موجود" };
  const title = `${p.full_name}${p.headline ? " — " + p.headline : ""}`;
  return {
    title,
    description: p.headline ?? p.bio_long?.slice(0, 150) ?? undefined,
    openGraph: { title, type: "profile", images: p.avatar_url ? [p.avatar_url] : undefined },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getProfessionalBySlug(decodeURIComponent(slug));
  if (!p) notFound();

  const articles = await getArticlesByProfessional(p.id);
  // تسجيل مشاهدة الملف (لا يعطّل الصفحة إن فشل)
  void logEvent("profile", p.id, "view");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: p.full_name,
    jobTitle: p.headline ?? p.specialization ?? undefined,
    address: p.city ? { "@type": "PostalAddress", addressLocality: p.city } : undefined,
    knowsAbout: p.specialties?.map((s) => s.name),
  };

  const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lawyer-id-tgi1.vercel.app";
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسة", item: BASE + "/" },
      { "@type": "ListItem", position: 2, name: "المختصّون", item: BASE + "/search" },
      { "@type": "ListItem", position: 3, name: p.full_name },
    ],
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main */}
        <div className="lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-content">{p.full_name}</h1>
                <TierBadge tier={p.tier} />
              </div>
              {p.headline && <p className="mt-1 text-muted">{p.headline}</p>}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.specialties?.map((s) => (
                  <Link key={s.id} href={`/fields/${encodeURIComponent(s.slug)}`}>
                    <Badge tone="lawyer">{s.name}</Badge>
                  </Link>
                ))}
                {p.city && <Badge tone="neutral">{p.city}</Badge>}
                {typeof p.years_experience === "number" && p.years_experience > 0 && (
                  <Badge tone="neutral">{p.years_experience} سنوات خبرة</Badge>
                )}
              </div>
            </div>
            <ShareButton title={p.full_name ?? undefined} />
          </div>

          {p.bio_long && (
            <div className="mt-6 rounded-xl border border-line bg-card p-5">
              <h2 className="text-lg font-semibold text-content">نبذة</h2>
              <p className="mt-2 whitespace-pre-line leading-relaxed text-muted">{p.bio_long}</p>
            </div>
          )}

          <div className="mt-6">
            <h2 className="text-lg font-semibold text-content">مقالات {p.full_name}</h2>
            {articles.length === 0 ? (
              <p className="mt-2 text-sm text-muted">لا مقالات منشورة بعد.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {articles.map((a) => (
                  <Link
                    key={a.id}
                    href={`/articles/${encodeURIComponent(a.slug)}`}
                    className="block rounded-xl border border-line bg-card p-4 transition-colors hover:border-lawyer"
                  >
                    <div className="font-medium text-content">{a.title}</div>
                    {a.excerpt && <p className="mt-1 line-clamp-2 text-sm text-muted">{a.excerpt}</p>}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <ContactPanel
            professionalId={p.id}
            name={p.full_name ?? "المهنيّ"}
            whatsapp={p.contact_whatsapp}
            phone={p.contact_phone}
            email={p.contact_email}
            formEnabled={p.contact_form_enabled}
            source="profile"
          />
        </div>
      </div>
    </div>
  );
}
