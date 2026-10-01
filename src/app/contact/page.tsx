import { Metadata } from "next";
import ContactForm from "./contact-form";
import { getSiteSettings } from "@/lib/db/queries/public";

export const metadata: Metadata = {
  title: "Contact | Piregi Portfolio",
};

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ success?: string }> }) {
  const settings = await getSiteSettings();
  const params = await searchParams;
  const success = params.success === "1";

  return <ContactForm success={success} />;
}