import type { Metadata } from "next";
import ContactForm from "./contact-form";
import { getSiteSettings } from "@/lib/db/queries/public";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch about a project, role, or collaboration.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const params = await searchParams;
  const success = params.success === "1";

  // The privacy notice names the inbox that can delete a submission, and that
  // inbox is CMS-managed (site_settings.socials.email), so the page reads the
  // same cached settings row the nav/footer already use rather than hardcoding
  // an address the admin editor cannot change (ground rule 9, design.md §11).
  const settings = await getSiteSettings();

  // ContactForm owns its Container and heading; the breadcrumb schema rides
  // along inside it rather than wrapping it in a second Container, which
  // would stack the horizontal padding.
  return <ContactForm success={success} contactEmail={settings.socials?.email} />;
}