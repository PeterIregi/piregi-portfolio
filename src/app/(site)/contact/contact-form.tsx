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
};

export default function ContactForm({ success }: Props) {
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
        {error && (
          <div className="p-4 rounded border border-claret bg-claret/10 text-claret text-sm">
            {error}
          </div>
        )}

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
            className="h-32 w-full rounded border border-line bg-white px-3.5 py-3.5 text-ink placeholder:text-graphite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-claret resize-y"
            placeholder="Your message..."
            disabled={loading}
          />
        </div>

        <input type="hidden" name="hp" value="" tabIndex={-1} autoComplete="off" />

        <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
          {loading ? "Sending&hellip;" : "Send message"}
        </Button>
      </form>
    </Container>
  );
}