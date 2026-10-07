"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type ExperienceRow = {
  id: string;
  roleTitle: string;
  organization: string;
  startDate: string;
  endDate: string | null;
  description: string;
  type: "work" | "education" | "certification";
  sortOrder: number;
};

export function ExperienceForm({
  initial,
  created,
}: {
  initial: ExperienceRow;
  created: boolean;
}) {
  const router = useRouter();

  const [roleTitle, setRoleTitle] = useState(initial.roleTitle);
  const [organization, setOrganization] = useState(initial.organization);
  const [startDate, setStartDate] = useState(initial.startDate);
  const [endDate, setEndDate] = useState(initial.endDate ?? "");
  const [description, setDescription] = useState(initial.description);
  const [type, setType] = useState<ExperienceRow["type"]>(initial.type);
  const [sortOrder, setSortOrder] = useState(initial.sortOrder);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError("");

    try {
      const res = await fetch(`/api/admin/experience/${initial.id}`, {
        method: "PUT",
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
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to update experience");
      }

      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update experience");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this experience entry?")) return;
    setError("");
    try {
      const res = await fetch(`/api/admin/experience/${initial.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to delete experience");
      }
      router.push("/admin/experience");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete experience");
    }
  };

  return (
    <Container className="py-8">
      <header className="mb-8">
        <h1 className="font-display text-3xl text-ink">Edit Experience</h1>
        <Link
          href="/admin/experience"
          className="text-accent hover:text-accent-deep text-sm inline-block mt-2"
        >
          ← Back to experience
        </Link>
      </header>

      {created && (
        <div className="mb-6 p-4 rounded border border-graphite bg-shell text-graphite text-sm">
          Experience entry created successfully!
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
          label="Role Title"
          id="roleTitle"
          name="roleTitle"
          type="text"
          value={roleTitle}
          onChange={(e) => setRoleTitle(e.target.value)}
          required
        />
        <Input
          label="Organization"
          id="organization"
          name="organization"
          type="text"
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          required
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Start Date"
            id="startDate"
            name="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
          <Input
            label="End Date (optional)"
            id="endDate"
            name="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="description" className="text-sm font-medium text-ink">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-24 w-full rounded border border-edge bg-paper px-3.5 py-3.5 text-ink placeholder:text-graphite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent resize-y"
            placeholder="Description..."
          />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <label htmlFor="type" className="text-sm font-medium text-ink">
              Type
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as ExperienceRow["type"])}
              className="h-11 w-full rounded border border-edge bg-paper px-3.5 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <option value="work">Work</option>
              <option value="education">Education</option>
              <option value="certification">Certification</option>
            </select>
          </div>
          <Input
            label="Sort Order"
            id="sortOrder"
            name="sortOrder"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            required
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
          <Link href="/admin/experience">
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
