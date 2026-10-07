import { Metadata } from "next";
import { getSiteSettings } from "@/lib/db/queries/public";
import { requireAdmin } from "@/lib/auth/guards";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = {
  title: "Settings | Admin",
};

export default async function SettingsPage() {
  await requireAdmin();
  const settings = await getSiteSettings();

  return (
    <SettingsForm
      initial={{
        brand: {
          name: settings.brand?.name ?? "",
          tagline: settings.brand?.tagline ?? "",
        },
        meta: {
          title: settings.meta?.title ?? "",
          description: settings.meta?.description ?? "",
          ogImage: settings.meta?.ogImage ?? "",
        },
        socials: {
          github: settings.socials?.github ?? "",
          linkedin: settings.socials?.linkedin ?? "",
          email: settings.socials?.email ?? "",
        },
        bio: {
          photoMediaId: settings.bio?.photoMediaId ?? "",
        },
      }}
    />
  );
}
