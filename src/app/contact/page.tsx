import { Metadata } from "next";
import ContactForm from "./contact-form";

export const metadata: Metadata = {
  title: "Contact | Piregi Portfolio",
};

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ success?: string }> }) {
  const params = await searchParams;
  const success = params.success === "1";

  return <ContactForm success={success} />;
}