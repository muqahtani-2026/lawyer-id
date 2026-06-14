import type { MetadataRoute } from "next";

const BASE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://lawyer-id-tgi1.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard", "/review", "/profile", "/schedule", "/library", "/api/", "/connect", "/onboarding", "/upgrade", "/auth"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
