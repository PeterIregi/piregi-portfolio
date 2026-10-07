import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { getSkillById } from "@/lib/db/queries/admin";
import { SkillForm } from "@/components/admin/skill-form";

export default async function EditSkillPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { created } = await searchParams;

  const skill = await getSkillById(id);
  if (!skill) notFound();

  return (
    <SkillForm
      initial={{
        id: skill.id,
        name: skill.name,
        category: skill.category,
        proficiency: skill.proficiency,
      }}
      created={created === "1"}
    />
  );
}
