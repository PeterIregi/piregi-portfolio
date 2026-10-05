import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Instrument_Sans, Newsreader } from "next/font/google";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Piregi Portfolio",
  description: "Personal portfolio: work, experience, and a downloadable CV.",
  // Every page declares its canonical as a path (`alternates: { canonical:
  // "/about" }`). Without a base, Next emits that path verbatim and the tag
  // ships as `href="/about"`, which is not a valid absolute URL -- Lighthouse
  // scored SEO 92 on five of six routes for exactly this (#78). siteUrl() is
  // the single origin the sitemap, robots.txt and JSON-LD already use.
  metadataBase: new URL(siteUrl()),
};

// Root layout only: <html lang> is what screen readers use to pick a
// pronunciation (WCAG 3.1.1), and globals.css has to be in this module graph
// or Tailwind never runs and the design tokens below it resolve to nothing.
// The public chrome lives in app/(site)/layout.tsx, so the admin shell is not
// wrapped in the site nav and footer (design.md §6).
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${instrumentSans.variable} ${newsreader.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-paper text-ink">
        {children}
      </body>
    </html>
  );
}
