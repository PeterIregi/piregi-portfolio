"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type TestimonialRow = {
  id: string;
  authorName: string;
  authorTitle: string;
  company: string | null;
  quote: string;
};

export function TestimonialForm({
  initial,
  created,
}: {
  initial: TestimonialRow;
  created: boolean;
}) {
  const router = useRouter();

  const [authorName, setAuthorName] = useState(initial.authorName);
  const [authorTitle, setAuthorTitle] = useState(initial.authorTitle);
  const [company, setCompany] = useState(initial.company ?? "");
  const [quote, setQuote] = useState(initial.quote);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError("");

    try {
      const res = await fetch(`/api/admin/testimonials/${initial.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName,
          authorTitle,
          company: company || undefined,
          quote,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to update testimonial");
      }

      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update testimonial");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this testimonial?")) return;
    setError("");
    try {
      const res = await fetch(`/api/admin/testimonials/${initial.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to delete testimonial");
      }
      router.push("/admin/testimonials");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete testimonial");
    }
  };

  return (
    <Container className="py-8">
      <header className="mb-8">
        <h1 className="font-display text-3xl text-ink">Edit Testimonial</h1>
        <Link
          href="/admin/testimonials"
          className="text-accent hover:text-accent-deep text-sm inline-block mt-2"
        >
          ← Back to testimonials
        </Link>
      </header>

      {created && (
        <div className="mb-6 p-4 rounded border border-graphite bg-shell text-graphite text-sm">
          Testimonial created successfully!
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded border border-graphite bg-shell text-graphite text-sm">
          Changes saved!
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-6 p-4 rounded border border-accent bg-accent/10 text-accent text-sm"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <Input
          label="Author Name"
          id="authorName"
          name="authorName"
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          required
        />
        <Input
          label="Author Title"
          id="authorTitle"
          name="authorTitle"
          type="text"
          value={authorTitle}
          onChange={(e) => setAuthorTitle(e.target.value)}
          required
        />
        <Input
          label="Company (optional)"
          id="company"
          name="company"
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
        <div className="flex flex-col gap-2">
          <label htmlFor="quote" className="text-sm font-medium text-ink">
            Quote
          </label>
          <textarea
            id="quote"
            name="quote"
            required
            rows={4}
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            className="h-24 w-full rounded border border-edge bg-paper px-3.5 py-3.5 text-ink placeholder:text-graphite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent resize-y"
            placeholder="Testimonial quote..."
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
          <Link href="/admin/testimonials">
            <Button variant="secondary">Cancel</Button>
          </Link>
          <Button type="button" variant="secondary" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </form>
    </Container>
  );
}
