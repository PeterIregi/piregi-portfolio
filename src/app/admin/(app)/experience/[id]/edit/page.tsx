import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { getExperienceById } from "@/lib/db/queries/admin";
import { ExperienceForm } from "@/components/admin/experience-form";

export default async function EditExperiencePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { created } = await searchParams;

  const experience = await getExperienceById(id);
  if (!experience) notFound();

  return (
    <ExperienceForm
      initial={{
        id: experience.id,
        roleTitle: experience.roleTitle,
        organization: experience.organization,
        startDate: experience.startDate,
        endDate: experience.endDate,
        description: experience.description,
        type: experience.type as "work" | "education" | "certification",
        sortOrder: experience.sortOrder,
      }}
      created={created === "1"}
    />
  );
}
