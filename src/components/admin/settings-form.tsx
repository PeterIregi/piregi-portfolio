"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MediaPicker } from "@/components/admin/media-picker";

export type SettingsValues = {
  brand: { name: string; tagline: string };
  meta: { title: string; description: string; ogImage: string };
  socials: { github: string; linkedin: string; email: string };
  bio?: { photoMediaId?: string | null };
};

export function SettingsForm({ initial }: { initial: SettingsValues }) {
  const router = useRouter();

  const [name, setName] = useState(initial.brand.name);
  const [tagline, setTagline] = useState(initial.brand.tagline);
  const [metaTitle, setMetaTitle] = useState(initial.meta.title);
  const [metaDescription, setMetaDescription] = useState(initial.meta.description);
  const [ogImage, setOgImage] = useState(initial.meta.ogImage);
  const [github, setGithub] = useState(initial.socials.github);
  const [linkedin, setLinkedin] = useState(initial.socials.linkedin);
  const [email, setEmail] = useState(initial.socials.email);
  const [photoMediaId, setPhotoMediaId] = useState(initial.bio?.photoMediaId ?? "");

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError("");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: { name, tagline },
          meta: { title: metaTitle, description: metaDescription, ogImage },
          socials: { github, linkedin, email },
          bio: { photoMediaId: photoMediaId || null },
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Failed to save settings");

      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container className="py-8 max-w-3xl">
      <h1 className="font-display text-3xl text-ink mb-8">Site Settings</h1>

      {success && (
        <div className="mb-8 p-4 rounded border border-graphite bg-shell text-graphite text-sm">
          Settings saved!
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-8 p-4 rounded border border-accent bg-accent/10 text-accent text-sm"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-12">
        <section>
          <h2 className="font-display text-xl text-ink mb-6">Brand</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              id="siteName"
              label="Site Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              id="tagline"
              label="Tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
            />
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink mb-6">Meta</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              id="metaTitle"
              label="Title"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
            />
            <Input
              id="metaDescription"
              label="Description"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
            />
          </div>
          <div className="mt-4">
            <Input
              id="ogImage"
              label="OG Image URL"
              type="url"
              value={ogImage}
              onChange={(e) => setOgImage(e.target.value)}
              placeholder="https://example.com/og.png"
            />
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink mb-6">Social Links</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              id="githubUrl"
              label="GitHub URL"
              type="url"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              placeholder="https://github.com/username"
            />
            <Input
              id="linkedinUrl"
              label="LinkedIn URL"
              type="url"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/username"
            />
            <Input
              id="contactEmail"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink mb-6">Bio</h2>
          <MediaPicker
            value={photoMediaId}
            onChange={setPhotoMediaId}
            label="Bio Photo"
            emptyMessage="No bio photo selected"
          />
        </section>

        <div>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save Settings"}
          </Button>
        </div>
      </form>
    </Container>
  );
}
