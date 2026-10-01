import { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { listAllProjects } from "@/lib/db/queries/admin";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Projects | Admin",
};

export default async function AdminProjectsPage() {
  const projects = await listAllProjects();

  return (
    <Container className="py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-ink">Projects</h1>
        <Link href="/admin/projects/new">
          <Button variant="primary">New Project</Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="bg-shell rounded-lg p-12 text-center">
          <p className="text-graphite mb-6">No projects yet.</p>
          <Link href="/admin/projects/new">
            <Button variant="primary">Create your first project</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-shell rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left p-4 font-medium text-ink">Title</th>
                <th className="text-left p-4 font-medium text-ink">Status</th>
                <th className="text-left p-4 font-medium text-ink">Updated</th>
                <th className="text-right p-4 font-medium text-ink">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-claret/5">
                  <td className="p-4">
                    <p className="font-medium text-ink">{project.title}</p>
                    <p className="text-sm text-graphite truncate max-w-xs">{project.slug}</p>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      project.status === "published"
                        ? "bg-claret/10 text-claret"
                        : "bg-graphite/10 text-graphite"
                    }`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-graphite">
                    {format(new Date(project.updatedAt), "MMM d, yyyy")}
                  </td>
                  <td className="p-4 text-right">
                    <Link href={`/admin/projects/${project.id}/edit`} className="text-claret hover:text-claret-deep text-sm font-medium">
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