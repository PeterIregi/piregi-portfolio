"use client";

import { useState } from "react";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function NewSkillPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [proficiency, setProficiency] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError("");

    try {
      const res = await fetch("/api/admin/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, proficiency }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create");
      }

      const data = await res.json();
      router.push(`/admin/skills/${data.id}/edit?created=1`);
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create");
      setLoading(false);
    }
  };

  return (
    <Container className="py-8">
      <header className="mb-8">
        <h1 className="font-display text-3xl text-ink">New Skill</h1>
      </header>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
        {formError && <div className="p-4 rounded border border-accent bg-accent/10 text-accent text-sm">{formError}</div>}

        <Input label="Name" id="name" name="name" type="text" value={name} onChange={e => setName(e.target.value)} required />
        <Input label="Category" id="category" name="category" type="text" value={category} onChange={e => setCategory(e.target.value)} required />
        <Input label="Proficiency (1-5)" id="proficiency" name="proficiency" type="number" min={1} max={5} value={proficiency} onChange={e => setProficiency(Number(e.target.value))} required />

        <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
          {loading ? "Creating…" : "Create Skill"}
        </Button>
      </form>
    </Container>
  );
}