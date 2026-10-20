import type { MetadataRoute } from "next";
import snapshot from "@/src/data/prelaunch-public-snapshot.json";

const BASE_URL = "https://sewsuite.com";

const SERVICE_SLUGS = snapshot.ServiceType.filter(service => service.active && service.publicly_advertised).map(service => service.slug);

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const serviceUrls = SERVICE_SLUGS.map((slug) => ({
    url: `${BASE_URL}/services/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const cityUrls = snapshot.ServiceArea.filter(area => area.active && area.indexable).map(area => ({
    url: `${BASE_URL}/service-areas/${area.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/services`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    ...serviceUrls,
    {
      url: `${BASE_URL}/service-areas`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...cityUrls,
    {
      url: `${BASE_URL}/gallery`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.8,
    },
  ];
}
