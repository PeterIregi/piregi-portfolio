"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type SkillRow = {
  id: string;
  name: string;
  category: string;
  proficiency: number | null;
};

export function SkillForm({ initial, created }: { initial: SkillRow; created: boolean }) {
  const router = useRouter();

  const [name, setName] = useState(initial.name);
  const [category, setCategory] = useState(initial.category);
  const [proficiency, setProficiency] = useState(
    initial.proficiency === null ? "" : String(initial.proficiency)
  );
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError("");

    try {
      const res = await fetch(`/api/admin/skills/${initial.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          // proficiency is optional (schema.ts). Omit it when blank so the
          // row stores NULL rather than failing the 1-5 bound.
          ...(proficiency === "" ? {} : { proficiency: Number(proficiency) }),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to update skill");
      }

      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update skill");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this skill?")) return;
    setError("");
    try {
      const res = await fetch(`/api/admin/skills/${initial.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to delete skill");
      }
      router.push("/admin/skills");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete skill");
    }
  };

  return (
    <Container className="py-8">
      <header className="mb-8">
        <h1 className="font-display text-3xl text-ink">Edit Skill</h1>
        <Link
          href="/admin/skills"
          className="text-accent hover:text-accent-deep text-sm inline-block mt-2"
        >
          ← Back to skills
        </Link>
      </header>

      {created && (
        <div className="mb-6 p-4 rounded border border-graphite bg-shell text-graphite text-sm">
          Skill created successfully!
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

      <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
        <Input
          label="Name"
          id="name"
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Category"
          id="category"
          name="category"
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        />
        <Input
          label="Proficiency (1-5, optional)"
          id="proficiency"
          name="proficiency"
          type="number"
          min={1}
          max={5}
          value={proficiency}
          onChange={(e) => setProficiency(e.target.value)}
        />

        <div className="flex flex-wrap gap-3">
          <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
          <Link href="/admin/skills">
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
