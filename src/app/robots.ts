import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

// No dynamic export on purpose: robots.txt reads only the environment, not
// site_settings, so it can be prerendered. sitemap.ts cannot, because it
// lists published projects.
export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // A crawler hint, not the access boundary: every admin route is
      // protected by requireAdmin() in its handler (design.md §4).
      disallow: ["/admin", "/api"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}