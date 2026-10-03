import { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/db/queries/public";

// Generated on request for the same reason as the site layout: the query
// needs a database the build does not have.
export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSiteSettings();
  const baseUrl = settings.meta?.ogImage?.includes("http") 
    ? settings.meta.ogImage.replace("/og-image.jpg", "") 
    : "https://piregi.dev";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/admin/login"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}