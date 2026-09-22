import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Instrument_Sans, Newsreader } from "next/font/google";
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
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${instrumentSans.variable} ${newsreader.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}