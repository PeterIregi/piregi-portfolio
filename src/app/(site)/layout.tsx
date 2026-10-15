import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/db/queries/public";
import { siteUrl } from "@/lib/site-url";
import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { PageViewBeacon } from "@/components/site/page-view-beacon";
import { StructuredData, personSchema, webSiteSchema } from "@/components/site/structured-data";
import { SkipLink } from "@/components/ui/skip-link";

// The nav and footer render rows from site_settings, so this layout can
// never be prerendered: the build runs without a DATABASE_URL on purpose
// (the CI verify job keeps production credentials off preview builds too,
// design.md §8), and an admin edit has to show up on the next request
// rather than at the next deploy.
export const dynamic = "force-dynamic";

// Titles, descriptions and Open Graph come from the `meta` and `brand` rows so
// the admin settings actually drive the public head (prd §7 Must, ground rule
// 9). The brand name lives here and in site_settings, never repeated into page
// files: a page sets a bare title and the template appends the brand. This is a
// route-level metadata export rather than the root layout's static one, which
// stays as the fallback for the admin shell.
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const brandName = settings.brand?.name ?? "Piregi Portfolio";
  const title = settings.meta?.title ?? brandName;
  const description = settings.meta?.description;
  const ogImage = settings.meta?.ogImage;

  return {
    title: { default: title, template: `%s | ${brandName}` },
    description,
    // Inner pages leave their Open Graph to this block, so og:title is the
    // site title there and each page's own `<title>`/description still carry
    // the page-specific text. Project detail sets its own to advertise the
    // project name and cover.
    openGraph: {
      type: "website",
      siteName: brandName,
      url: siteUrl(),
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const brandName = settings.brand?.name ?? "Piregi Portfolio";

  return (
    <div className="flex flex-col min-h-screen">
      {/* Site-wide identity only. Per-page schemas (BreadcrumbList on inner
          pages, CreativeWork on project detail) belong to the page that has
          the data, not here. */}
      <StructuredData data={personSchema(settings, siteUrl())} />
      <StructuredData data={webSiteSchema(brandName, siteUrl())} />
      <SkipLink />
      <Nav cvHref="/cv" brand={settings.brand} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer socials={settings.socials} brand={settings.brand} />
      <PageViewBeacon />
    </div>
  );
}
