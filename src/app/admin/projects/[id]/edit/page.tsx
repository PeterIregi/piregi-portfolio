"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter, useParams, useSearchParams } from "next/navigation";

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const created = searchParams.get("created") === "1";
  const id = params.id as string;

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/admin/projects/${id}`);
        if (!res.ok) throw new Error("Failed to load project");
        const data = await res.json();
        setTitle(data.title);
        setSlug(data.slug);
        setSummary(data.summary);
        setDescription(data.description);
        setTechStack(data.techStack?.join(", ") ?? "");
        setTags(data.tags?.join(", ") ?? "");
        setProjectUrl(data.projectUrl ?? "");
        setRepoUrl(data.repoUrl ?? "");
        setStatus(data.status);
      } catch (err) {
        console.error(err);
      }
    }
    fetchProject();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: "PUT",
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
        throw new Error(data.error ?? "Failed to update project");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container className="py-8">
      <header className="mb-8">
        <h1 className="font-display text-3xl text-ink">Edit Project</h1>
        <Link href="/admin/projects" className="text-claret hover:text-claret-deep text-sm inline-block mt-2">
          ← Back to projects
        </Link>
      </header>

      {created && (
        <div className="mb-6 p-4 rounded border border-graphite bg-shell text-graphite text-sm">
          Project created successfully!
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded border border-graphite bg-shell text-graphite text-sm">
          Changes saved!
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
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

        <div className="flex gap-3">
          <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
          <Link href="/admin/projects">
            <Button variant="secondary">Cancel</Button>
          </Link>
        </div>
      </form>
    </Container>
  );
}