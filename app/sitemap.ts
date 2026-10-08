import type { MetadataRoute } from "next";
import { POSTS } from "@/lib/posts";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://mundolingu.com";
  return [
    { url: `${base}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/ielts-preparation-dubai`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/ielts-band-check`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/level-test`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.7 },
    ...POSTS.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: p.date, changeFrequency: "monthly" as const, priority: 0.6 })),
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/login`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
