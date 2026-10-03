import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { listPublishedProjects } from "@/lib/db/queries/public";

export const metadata: Metadata = {
  title: "Projects | Piregi Portfolio",
};

export default async function ProjectsPage() {
  const projects = await listPublishedProjects();

  return (
    <Container className="py-16 lg:py-24">
      <header className="mb-12 lg:mb-16 max-w-2xl">
        <h1 className="font-display text-4xl lg:text-5xl text-ink mb-4">Projects</h1>
        <p className="text-lg leading-relaxed text-graphite">
          A selection of work I&apos;ve built and shipped.
        </p>
      </header>

      {projects.length === 0 ? (
        <p className="text-graphite py-12">No published projects yet.</p>
      ) : (
        <div className="grid gap-x-8 gap-y-12 md:grid-cols-2">
          {projects.map((project) => (
            <article key={project.id}>
              {project.coverUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={project.coverUrl}
                  alt={project.coverAltText ?? ""}
                  className="aspect-[3/2] w-full rounded-lg object-cover"
                />
              )}
              <h2 className="mt-5 font-display text-2xl text-ink">
                {/* The title is the link: no arrow-suffixed button on every
                    card, which design.md §10 calls out as a generic tell. */}
                <Link href={`/projects/${project.slug}`} className="hover:text-claret transition-colors">
                  {project.title}
                </Link>
              </h2>
              <p className="mt-2 text-graphite">{project.summary}</p>
              {project.techStack.length > 0 && (
                <p className="mt-4 text-sm text-graphite">{project.techStack.join(" · ")}</p>
              )}
            </article>
          ))}
        </div>
      )}
    </Container>
  );
}