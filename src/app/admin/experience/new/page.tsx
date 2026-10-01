"use client";

import { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";

export default function NewExperiencePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const [roleTitle, setRoleTitle] = useState("");
  const [organization, setOrganization] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"work" | "education" | "certification">("work");
  const [sortOrder, setSortOrder] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError("");

    try {
      const res = await fetch("/api/admin/experience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleTitle,
          organization,
          startDate,
          endDate: endDate || null,
          description,
          type,
          sortOrder,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create");
      }

      const data = await res.json();
      router.push(`/admin/experience/${data.id}/edit?created=1`);
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create");
      setLoading(false);
    }
  };

  return (
    <Container className="py-8">
      <header className="mb-8">
        <h1 className="font-display text-3xl text-ink">New Experience</h1>
        <Link href="/admin/experience" className="text-claret hover:text-claret-deep text-sm inline-block mt-2">
          ← Back to experience
        </Link>
      </header>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {error && <div className="p-4 rounded border border-claret bg-claret/10 text-claret text-sm">{error}</div>}
        {formError && <div className="p-4 rounded border border-claret bg-claret/10 text-claret text-sm">{formError}</div>}

        <Input label="Role Title" id="roleTitle" name="roleTitle" type="text" value={roleTitle} onChange={e => setRoleTitle(e.target.value)} required />
        <Input label="Organization" id="organization" name="organization" type="text" value={organization} onChange={e => setOrganization(e.target.value)} required />
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Start Date" id="startDate" name="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
          <Input label="End Date (optional)" id="endDate" name="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="description" className="text-sm font-medium text-ink">Description</label>
          <textarea id="description" name="description" required rows={4} value={description} onChange={e => setDescription(e.target.value)} className="h-24 w-full rounded border border-line bg-white px-3.5 py-3.5 text-ink placeholder:text-graphite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-claret resize-y" placeholder="Description..." />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-ink">Type</label>
            <select value={type} onChange={e => setType(e.target.value as "work" | "education" | "certification")} className="h-11 w-full rounded border border-line bg-white px-3.5 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-claret">
              <option value="work">Work</option>
              <option value="education">Education</option>
              <option value="certification">Certification</option>
            </select>
          </div>
          <Input label="Sort Order" id="sortOrder" name="sortOrder" type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} required />
        </div>

        <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
          {loading ? "Creating…" : "Create Entry"}
        </Button>
      </form>
    </Container>
  );
}