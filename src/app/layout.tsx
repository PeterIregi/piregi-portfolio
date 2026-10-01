import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/db/queries/public";
import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";

export const metadata: Metadata = {
  title: "Piregi Portfolio",
  description: "Personal portfolio: work, experience, and a downloadable CV.",
};

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  return (
    <div className="flex flex-col min-h-screen">
      <Nav cvHref="/cv" brand={settings.brand} />
      <main className="flex-1">{children}</main>
      <Footer socials={settings.socials} brand={settings.brand} />
    </div>
  );
}