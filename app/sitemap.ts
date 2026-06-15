import type { MetadataRoute } from "next";
import {
  getPublishedArticles,
  getFeaturedProfessionals,
  getActiveFields,
  getActiveCities,
} from "@/lib/queries/public";

const BASE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://lawyer-id-tgi1.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["", "/search", "/articles", "/ask", "/pricing", "/about", "/fields", "/cities", "/legal/terms", "/legal/privacy", "/legal/disclaimer"].map(
    (p) => ({ url: `${BASE}${p}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.6 })
  );

  let dynamic: MetadataRoute.Sitemap = [];
  try {
    const [articles, pros, fields, cities] = await Promise.all([
      getPublishedArticles(500),
      getFeaturedProfessionals(500),
      getActiveFields(),
      getActiveCities(),
    ]);
    dynamic = [
      ...articles.map((a) => ({ url: `${BASE}/articles/${encodeURIComponent(a.slug)}`, lastModified: a.published_at ? new Date(a.published_at) : new Date(), priority: 0.7 })),
      ...pros.filter((p) => p.slug).map((p) => ({ url: `${BASE}/pros/${encodeURIComponent(p.slug as string)}`, lastModified: new Date(), priority: 0.7 })),
      ...fields.map((f) => ({ url: `${BASE}/fields/${encodeURIComponent(f.slug)}`, lastModified: new Date(), priority: 0.5 })),
      ...cities.map((c) => ({ url: `${BASE}/cities/${encodeURIComponent(c.city)}`, lastModified: new Date(), priority: 0.4 })),
    ];
  } catch {
    // إن تعذّر الوصول لقاعدة البيانات وقت البناء، نكتفي بالثابت
  }

  return [...staticRoutes, ...dynamic];
}
