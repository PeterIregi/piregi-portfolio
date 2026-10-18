"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { siteUrl } from "@/lib/site-url";
import { StructuredData, breadcrumbSchema } from "@/components/site/structured-data";

type Props = {
  success: boolean;
  contactEmail?: string;
};

export default function ContactForm({ success, contactEmail }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (success) return;

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("message", message);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Request failed");
      }

      router.push("/contact?success=1");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      setLoading(false);
    }
  };

  return (
    <Container className="py-16 lg:py-24">
      <StructuredData
        data={breadcrumbSchema(siteUrl(), [
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />

      <header className="mb-12 lg:mb-16">
        <h1 className="font-display text-4xl lg:text-5xl text-ink mb-4">Contact</h1>
        <p className="max-w-2xl text-lg leading-relaxed text-graphite">
          Have a project in mind or just want to say hello? I&apos;d love to hear from you.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
        {/* The container is always present and the message is injected into
            it, because a live region that is itself added to the DOM at the
            same moment as its text is unreliably announced. The error appears
            after submit with no focus move, so without this a screen reader
            user is told nothing went wrong. */}
        <div role="alert">
          {error && (
            <p className="p-4 rounded border border-accent bg-accent/10 text-accent text-sm">
              {error}
            </p>
          )}
        </div>

        <Input
          label="Name"
          id="name"
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          disabled={loading}
        />

        <Input
          label="Email"
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          disabled={loading}
        />

        <div className="flex flex-col gap-2">
          <label htmlFor="message" className="text-sm font-medium text-ink">Message</label>
          <textarea
            id="message"
            name="message"
            required
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="h-32 w-full rounded border border-edge bg-paper px-3.5 py-3.5 text-ink placeholder:text-graphite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent resize-y"
            placeholder="Your message..."
            disabled={loading}
          />
        </div>

        <input type="hidden" name="hp" value="" tabIndex={-1} autoComplete="off" />

        {/* Design.md §11: a one-paragraph privacy notice is a launch item,
            because these submissions are personal data the admin stores and
            can delete. The deletion contact is the CMS socials email, not a
            literal, so renaming the inbox in admin updates this notice too. */}
        <p className="text-sm text-graphite">
          Privacy notice: your name, email, and message are stored only so I can reply to you.
          They are visible only to me, never shared or used for marketing, and are kept until
          you ask me to delete them
          {contactEmail ? (
            <>
              {" — email "}
              <a
                href={`mailto:${contactEmail}`}
                className="text-accent underline underline-offset-2 transition-colors hover:text-ink"
              >
                {contactEmail}
              </a>
              {" and the submission is removed."}
            </>
          ) : (
            "."
          )}
        </p>

        <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
          {loading ? "Sending…" : "Send message"}
        </Button>
      </form>
    </Container>
  );
}