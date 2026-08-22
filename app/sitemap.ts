import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://mundolingu.com";
  return [
    { url: `${base}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/opportunities`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/level-test`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/login`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
