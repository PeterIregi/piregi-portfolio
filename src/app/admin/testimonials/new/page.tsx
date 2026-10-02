"use client";

import { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function NewTestimonialPage() {
  const router = useRouter();

  const [authorName, setAuthorName] = useState("");
  const [authorTitle, setAuthorTitle] = useState("");
  const [company, setCompany] = useState("");
  const [quote, setQuote] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError("");

    try {
      const res = await fetch("/api/admin/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName, authorTitle, company, quote }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create");
      }

      const data = await res.json();
      router.push(`/admin/testimonials/${data.id}/edit?created=1`);
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create");
      setLoading(false);
    }
  };

  return (
    <Container className="py-8">
      <header className="mb-8">
        <h1 className="font-display text-3xl text-ink">New Testimonial</h1>
        <Link href="/admin/testimonials" className="text-claret hover:text-claret-deep text-sm inline-block mt-2">← Back to testimonials</Link>
      </header>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {formError && <div className="p-4 rounded border border-claret bg-claret/10 text-claret text-sm">{formError}</div>}
        <Input label="Author Name" id="authorName" name="authorName" type="text" value={authorName} onChange={e => setAuthorName(e.target.value)} required />
        <Input label="Author Title" id="authorTitle" name="authorTitle" type="text" value={authorTitle} onChange={e => setAuthorTitle(e.target.value)} required />
        <Input label="Company (optional)" id="company" name="company" type="text" value={company} onChange={e => setCompany(e.target.value)} />
        <div className="flex flex-col gap-2">
          <label htmlFor="quote" className="text-sm font-medium text-ink">Quote</label>
          <textarea id="quote" name="quote" required rows={4} value={quote} onChange={e => setQuote(e.target.value)} className="h-24 w-full rounded border border-line bg-white px-3.5 py-3.5 text-ink placeholder:text-graphite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-claret resize-y" placeholder="Testimonial quote..." />
        </div>
        <Button type="submit" className="w-full sm:w-auto" disabled={loading}>{loading ? "Creating…" : "Create Testimonial"}</Button>
      </form>
    </Container>
  );
}