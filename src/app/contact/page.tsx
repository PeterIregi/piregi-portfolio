import type { Metadata } from "next";
import ContactForm from "./contact-form";

export const metadata: Metadata = {
  title: "Contact | Piregi Portfolio",
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

  // ContactForm owns its Container and heading; the breadcrumb schema rides
  // along inside it rather than wrapping it in a second Container, which
  // would stack the horizontal padding.
  return <ContactForm success={success} />;
}