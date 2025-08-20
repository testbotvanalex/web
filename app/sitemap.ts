// app/sitemap.ts
import type { MetadataRoute } from "next";
import { languages } from "@/lib/i18n";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.botmatic.be";

  // Домашняя безязыковая
  const root: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  // Локализованные URL + альты (hreflang)
  const localized: MetadataRoute.Sitemap = languages.map((lang) => ({
    url: `${base}/${lang}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.9,
    alternates: {
      languages: Object.fromEntries(
        languages.map((l) => [l, `${base}/${l}`])
      ),
    },
  }));

  return [...root, ...localized];
}
