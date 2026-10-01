import { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { listPublishedProjects } from "@/lib/db/queries/public";

export const metadata: Metadata = {
  title: "Projects | Piregi Portfolio",
};

export default async function ProjectsPage() {
  const projects = await listPublishedProjects();

  return (
    <Container className="py-16 lg:py-24">
      <header className="mb-12 lg:mb-16">
        <h1 className="font-display text-4xl lg:text-5xl text-ink mb-4">Projects</h1>
        <p className="max-w-2xl text-lg leading-relaxed text-graphite">
          A selection of work I&apos;ve built and shipped.
        </p>
      </header>

      {projects.length === 0 ? (
        <p className="text-graphite text-center py-12">No published projects yet.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <article key={project.id} className="bg-shell rounded-lg p-6 flex flex-col">
              <h2 className="font-display text-xl text-ink mb-2">{project.title}</h2>
              <p className="text-graphite text-sm mb-4 flex-1">{project.summary}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {project.techStack.slice(0, 4).map((tech) => (
                  <span key={tech} className="text-xs bg-claret/10 text-claret px-2 py-1 rounded">
                    {tech}
                  </span>
                ))}
              </div>
              <a href={`/projects/${project.slug}`} className="text-claret hover:text-claret-deep text-sm font-medium inline-flex items-center gap-1">
                View details →
              </a>
            </article>
          ))}
        </div>
      )}
    </Container>
  );
}