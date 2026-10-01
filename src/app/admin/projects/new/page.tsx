"use client";

import { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";

export default function NewProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [techStack, setTechStack] = useState("");
  const [tags, setTags] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError("");

    try {
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          summary,
          description,
          techStack: techStack.split(",").map(s => s.trim()).filter(Boolean),
          tags: tags.split(",").map(s => s.trim()).filter(Boolean),
          projectUrl: projectUrl || undefined,
          repoUrl: repoUrl || undefined,
          status,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create project");
      }

      const data = await res.json();
      router.push(`/admin/projects/${data.id}/edit?created=1`);
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create");
      setLoading(false);
    }
  };

  return (
    <Container className="py-8">
      <header className="mb-8">
        <h1 className="font-display text-3xl text-ink">New Project</h1>
        <Link href="/admin/projects" className="text-claret hover:text-claret-deep text-sm inline-block mt-2">
          ← Back to projects
        </Link>
      </header>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {error && (
          <div className="p-4 rounded border border-claret bg-claret/10 text-claret text-sm">
            {error}
          </div>
        )}

        {formError && (
          <div className="p-4 rounded border border-claret bg-claret/10 text-claret text-sm">
            {formError}
          </div>
        )}

        <Input label="Title" id="title" name="title" type="text" value={title} onChange={e => setTitle(e.target.value)} required />
        <Input label="Slug" id="slug" name="slug" type="text" value={slug} onChange={e => setSlug(e.target.value)} required />
        <Input label="Summary" id="summary" name="summary" type="text" value={summary} onChange={e => setSummary(e.target.value)} required />
        <div className="flex flex-col gap-2">
          <label htmlFor="description" className="text-sm font-medium text-ink">Description</label>
          <textarea
            id="description"
            name="description"
            required
            rows={6}
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="h-32 w-full rounded border border-line bg-white px-3.5 py-3.5 text-ink placeholder:text-graphite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-claret resize-y"
            placeholder="Full project description..."
          />
        </div>
        <Input label="Tech Stack (comma-separated)" id="techStack" name="techStack" type="text" value={techStack} onChange={e => setTechStack(e.target.value)} placeholder="Next.js, PostgreSQL, Tailwind" />
        <Input label="Tags (comma-separated)" id="tags" name="tags" type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="full-stack, e-commerce" />
        <Input label="Project URL" id="projectUrl" name="projectUrl" type="url" value={projectUrl} onChange={e => setProjectUrl(e.target.value)} placeholder="https://example.com" />
        <Input label="Repo URL" id="repoUrl" name="repoUrl" type="url" value={repoUrl} onChange={e => setRepoUrl(e.target.value)} placeholder="https://github.com/example" />

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-ink">Status</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value as "draft" | "published")}
            className="h-11 w-full rounded border border-line bg-white px-3.5 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-claret"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
          {loading ? "Creating…" : "Create Project"}
        </Button>
      </form>
    </Container>
  );
}