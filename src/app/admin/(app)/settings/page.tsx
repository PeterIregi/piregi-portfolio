import { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { getSiteSettings } from "@/lib/db/queries/public";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Settings | Admin",
};

export default async function SettingsPage() {
  await requireAdmin();
  const settings = await getSiteSettings();

  return (
    <Container className="py-8 max-w-3xl">
      <h1 className="font-display text-3xl text-ink mb-8">Site Settings</h1>

      <section className="mb-12">
        <h2 className="font-display text-xl text-ink mb-6">Brand</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Input id="siteName" label="Site Name" value={settings.brand?.name ?? ""} />
          <Input id="tagline" label="Tagline" value={settings.brand?.tagline ?? ""} />
        </div>
      </section>

      <section className="mb-12">
        <h2 className="font-display text-xl text-ink mb-6">Meta</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Input id="metaTitle" label="Title" value={settings.meta?.title ?? ""} />
          <Input id="metaDescription" label="Description" value={settings.meta?.description ?? ""} />
        </div>
        <Input id="ogImage" label="OG Image URL" value={settings.meta?.ogImage ?? ""} />
      </section>

      <section>
        <h2 className="font-display text-xl text-ink mb-6">Social Links</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Input id="githubUrl" label="GitHub URL" value={settings.socials?.github ?? ""} placeholder="https://github.com/username" />
          <Input id="linkedinUrl" label="LinkedIn URL" value={settings.socials?.linkedin ?? ""} placeholder="https://linkedin.com/in/username" />
          <Input id="contactEmail" label="Email" value={settings.socials?.email ?? ""} type="email" />
        </div>
      </section>
    </Container>
  );
}