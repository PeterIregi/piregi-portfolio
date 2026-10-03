import { Metadata } from "next";
import { getSiteSettings } from "@/lib/db/queries/public";
import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { PageViewBeacon } from "@/components/site/page-view-beacon";

export const metadata: Metadata = {
  title: "Piregi Portfolio",
  description: "Personal portfolio: work, experience, and a downloadable CV.",
};

// The nav and footer render rows from site_settings, so this layout can
// never be prerendered: the build runs without a DATABASE_URL on purpose
// (the CI verify job keeps production credentials off preview builds too,
// design.md §8), and an admin edit has to show up on the next request
// rather than at the next deploy.
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  return (
    <div className="flex flex-col min-h-screen">
      <Nav cvHref="/cv" brand={settings.brand} />
      <main className="flex-1">{children}</main>
      <Footer socials={settings.socials} brand={settings.brand} />
      <PageViewBeacon />
    </div>
  );
}