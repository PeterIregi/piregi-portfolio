import { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { listAllSkills } from "@/lib/db/queries/admin";

export const metadata: Metadata = {
  title: "Skills | Admin",
};

export default async function AdminSkillsPage() {
  const skills = await listAllSkills();

  return (
    <Container className="py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-ink">Skills</h1>
        <Link href="/admin/skills/new">
          <Button variant="primary">New Skill</Button>
        </Link>
      </div>

      {skills.length === 0 ? (
        <div className="bg-shell rounded-lg p-12 text-center">
          <p className="text-graphite mb-6">No skills yet.</p>
          <Link href="/admin/skills/new">
            <Button variant="primary">Add your first skill</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-shell rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left p-4 font-medium text-ink">Name</th>
                <th className="text-left p-4 font-medium text-ink">Category</th>
                <th className="text-left p-4 font-medium text-ink">Proficiency</th>
                <th className="text-right p-4 font-medium text-ink">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {skills.map((skill) => (
                <tr key={skill.id} className="hover:bg-accent/5">
                  <td className="p-4 font-medium text-ink">{skill.name}</td>
                  <td className="p-4 text-sm text-graphite">{skill.category}</td>
                  <td className="p-4">
                    {skill.proficiency ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
                        {skill.proficiency}/5
                      </span>
                    ) : (
                      <span className="text-sm text-graphite/60">—</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <Link href={`/admin/skills/${skill.id}/edit`} className="text-accent hover:text-accent-deep text-sm font-medium">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Container>
  );
}