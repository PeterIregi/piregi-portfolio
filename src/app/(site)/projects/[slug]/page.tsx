import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { MediaFrame } from "@/components/ui/media-frame";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  getPublishedProjectBySlug,
  listPublishedProjectGallery,
} from "@/lib/db/queries/public";
import { siteUrl } from "@/lib/site-url";
import {
  StructuredData,
  breadcrumbSchema,
  creativeWorkSchema,
} from "@/components/site/structured-data";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProjectBySlug(slug);

  if (!project) {
    return { title: "Project not found | Piregi Portfolio" };
  }

  return {
    title: `${project.title} | Piregi Portfolio`,
    description: project.summary,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      title: project.title,
      description: project.summary,
      type: "article",
      ...(project.coverUrl ? { images: [{ url: project.coverUrl }] } : {}),
    },
  };
}

/**
 * Descriptions are plain text from the admin textarea, so blank lines are
 * the only structure available. Splitting on them keeps the write-up's
 * paragraphing without pulling in a markdown renderer for content that
 * never uses one.
 */
function paragraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;

  // A draft resolves to no row here, so an unpublished project 404s for
  // visitors instead of rendering (design.md §3).
  const project = await getPublishedProjectBySlug(slug);
  if (!project) notFound();

  const gallery = await listPublishedProjectGallery(project.id);
  const [lead, ...rest] = paragraphs(project.description);
  const plates = gallery.filter((item) => item.publicUrl !== project.coverUrl);
  const baseUrl = siteUrl();

  return (
    <article>
      <StructuredData
        data={breadcrumbSchema(baseUrl, [
          { name: "Home", path: "/" },
          { name: "Projects", path: "/projects" },
          { name: project.title, path: `/projects/${project.slug}` },
        ])}
      />
      <StructuredData data={creativeWorkSchema(project, baseUrl)} />

      <Container className="pt-16 pb-12 lg:pt-24">
        <Link
          href="/projects"
          className="text-sm text-graphite hover:text-accent transition-colors"
        >
          All projects
        </Link>

        <header className="mt-8 max-w-3xl">
          <h1 className="font-display text-4xl lg:text-5xl text-ink">{project.title}</h1>
          {/* The single accent gesture on the page: one caret rule under the
              title, rather than an accent colour on every label. */}
          <div aria-hidden="true" className="mt-6 h-0.5 w-16 bg-accent" />
          <p className="mt-6 text-lg leading-relaxed text-graphite">{project.summary}</p>
        </header>

        {project.techStack.length > 0 && (
          <dl className="mt-10 grid gap-6 border-y border-line py-6 sm:grid-cols-3">
            <div>
              <dt className="text-sm text-graphite">Built with</dt>
              <dd className="mt-1 text-ink">{project.techStack.join(", ")}</dd>
            </div>
            {project.tags.length > 0 && (
              <div>
                <dt className="text-sm text-graphite">Focus</dt>
                <dd className="mt-1 text-ink">{project.tags.join(", ")}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm text-graphite">Last updated</dt>
              <dd className="mt-1 text-ink">
                <time dateTime={project.updatedAt.toISOString()}>
                  {format(project.updatedAt, "MMMM yyyy")}
                </time>
              </dd>
            </div>
          </dl>
        )}
      </Container>

      {project.coverUrl && (
        <Container>
          <MediaFrame
            width={project.coverWidth}
            height={project.coverHeight}
            fallback="3 / 2"
          >
            <Image
              src={project.coverUrl}
              alt={project.coverAltText ?? ""}
              fill
              priority
              sizes="(min-width: 1152px) 1152px, 100vw"
              className="rounded-lg object-cover"
            />
          </MediaFrame>
        </Container>
      )}

      <Container className="py-12 lg:py-16">
        <div className="max-w-2xl">
          {lead && <p className="text-lg leading-relaxed text-ink">{lead}</p>}
          {rest.map((block) => (
            <p key={block.slice(0, 32)} className="mt-6 leading-relaxed text-graphite">
              {block}
            </p>
          ))}

          {(project.projectUrl || project.repoUrl) && (
            <div className="mt-10 flex flex-wrap gap-3">
              {project.projectUrl && (
                <Button
                  variant="primary"
                  href={project.projectUrl}
                  rel="noopener noreferrer"
                >
                  Visit live site
                </Button>
              )}
              {project.repoUrl && (
                <Button variant="secondary" href={project.repoUrl} rel="noopener noreferrer">
                  Read source
                </Button>
              )}
            </div>
          )}
        </div>
      </Container>

      {plates.length > 0 && (
        <Container className="pb-16 lg:pb-24">
          <h2 className="font-display text-2xl text-ink">Screens</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {plates.map((plate, index) => (
              <MediaFrame
                key={plate.id}
                as="figure"
                width={plate.width}
                height={plate.height}
                fallback="3 / 2"
                className={index === 0 ? "sm:col-span-2" : ""}
              >
                <Image
                  src={plate.publicUrl}
                  alt={plate.altText ?? ""}
                  fill
                  sizes="(min-width: 640px) 66vw, 100vw"
                  className="rounded-lg border border-line object-cover"
                />
              </MediaFrame>
            ))}
          </div>
        </Container>
      )}
    </article>
  );
}