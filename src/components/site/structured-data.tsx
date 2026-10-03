type Json = Record<string, unknown>;

/**
 * JSON-LD is static markup for crawlers, not interactive UI, so this is a
 * plain server-rendered script tag. Hydrating it would only delay the tag
 * crawlers read (and the "use client" boundary would pull the whole layout
 * into the client bundle).
 */
export function StructuredData({ data }: { data: Json }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output can legitimately contain "<" in a title or
      // bio, which would close the script tag early if it were not escaped.
      dangerouslySetInnerHTML={{ __html: serialize(data) }}
    />
  );
}

/**
 * Escapes the two sequences that can break out of a <script> block. Every
 * other character is left alone so the payload stays valid JSON-LD.
 */
function serialize(data: Json): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

export function personSchema(settings: {
  brand?: { name?: string; tagline?: string };
  socials?: { github?: string; linkedin?: string; email?: string };
  meta?: { description?: string; ogImage?: string };
}, baseUrl: string) {
  const name = settings.brand?.name ?? "Peter Iregi";
  const jobTitle = settings.brand?.tagline ?? "Full Stack Developer";

  const sameAs = [
    settings.socials?.linkedin,
    settings.socials?.github,
  ].filter((value): value is string => Boolean(value));

  const person: Json = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    jobTitle,
    url: baseUrl,
  };

  // Omitted rather than emitted empty: an empty image/sameAs is worse for
  // consumers than the property being absent until the admin fills it in.
  if (settings.meta?.description) person.description = settings.meta.description;
  if (settings.meta?.ogImage) person.image = settings.meta.ogImage;
  if (sameAs.length > 0) person.sameAs = sameAs;
  if (settings.socials?.email) person.email = settings.socials.email;

  return person;
}

export function webSiteSchema(name: string, baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url: baseUrl,
  };
}

export function breadcrumbSchema(
  baseUrl: string,
  trail: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.path}`,
    })),
  };
}

export function creativeWorkSchema(
  project: { title: string; summary: string; slug: string; coverUrl?: string | null; updatedAt: Date },
  baseUrl: string,
) {
  const work: Json = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.summary,
    url: `${baseUrl}/projects/${project.slug}`,
    dateModified: project.updatedAt.toISOString(),
  };

  if (project.coverUrl) work.image = project.coverUrl;

  return work;
}