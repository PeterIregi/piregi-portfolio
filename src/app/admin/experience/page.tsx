import { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { listAllExperiences } from "@/lib/db/queries/admin";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Experience | Admin",
};

export default async function AdminExperiencePage() {
  const experiences = await listAllExperiences();

  return (
    <Container className="py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-ink">Experience</h1>
        <Link href="/admin/experience/new">
          <Button variant="primary">New Entry</Button>
        </Link>
      </div>

      {experiences.length === 0 ? (
        <div className="bg-shell rounded-lg p-12 text-center">
          <p className="text-graphite mb-6">No experience entries yet.</p>
          <Link href="/admin/experience/new">
            <Button variant="primary">Add your first entry</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-shell rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left p-4 font-medium text-ink">Role</th>
                <th className="text-left p-4 font-medium text-ink">Organization</th>
                <th className="text-left p-4 font-medium text-ink">Type</th>
                <th className="text-left p-4 font-medium text-ink">Period</th>
                <th className="text-right p-4 font-medium text-ink">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {experiences.map((exp) => (
                <tr key={exp.id} className="hover:bg-accent/5">
                  <td className="p-4">
                    <p className="font-medium text-ink">{exp.roleTitle}</p>
                  </td>
                  <td className="p-4 text-sm text-graphite">{exp.organization}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent capitalize">
                      {exp.type}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-graphite">
                    {format(new Date(exp.startDate), "MMM yyyy")} – {exp.endDate ? format(new Date(exp.endDate), "MMM yyyy") : "Present"}
                  </td>
                  <td className="p-4 text-right">
                    <Link href={`/admin/experience/${exp.id}/edit`} className="text-accent hover:text-accent-deep text-sm font-medium">
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