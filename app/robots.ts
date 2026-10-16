import type { MetadataRoute } from "next";
// Dedicated private prelaunch comparison branch: do not index duplicate pages.
export default function robots(): MetadataRoute.Robots {
  return {rules:[{userAgent:"*",disallow:"/"}]};
}
