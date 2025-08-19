// app/sitemap.ts
import type { MetadataRoute } from "next";
import { languages } from "@/lib/i18n";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.botmatic.be";
  const now = new Date().toISOString();

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...languages.map((l) => ({
      url: `${base}/${l}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    })),
  ];
  return entries;
}
