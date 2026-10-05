import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import {
  getSiteSettings,
  listSkills,
  getBioPhoto,
} from "@/lib/db/queries/public";
import { siteUrl } from "@/lib/site-url";
import { StructuredData, breadcrumbSchema } from "@/components/site/structured-data";

export const metadata: Metadata = {
  title: "About | Piregi Portfolio",
  description: "Background, skills by category, and the working principles behind the work.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const [settings, skills, bioPhoto] = await Promise.all([
    getSiteSettings(),
    listSkills(),
    getBioPhoto(),
  ]);

  const skillsByCategory = skills.reduce((acc, skill) => {
    (acc[skill.category] ??= []).push(skill);
    return acc;
  }, {} as Record<string, typeof skills>);

  return (
    <Container className="py-16 lg:py-24">
      <StructuredData
        data={breadcrumbSchema(siteUrl(), [
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />

      <header className="mb-12 lg:mb-16 flex flex-col md:flex-row md:items-start md:justify-between gap-8">
        <div className="md:w-2/3">
          <h1 className="font-display text-4xl lg:text-5xl text-ink mb-4">About</h1>
          <p className="max-w-2xl text-lg leading-relaxed text-graphite">
            {settings.brand?.tagline ?? "Full Stack Developer"} passionate about building reliable, scalable software.
          </p>
        </div>
        {bioPhoto && (
          <div className="w-full md:w-1/3 flex-shrink-0 relative aspect-square">
            <Image
              src={bioPhoto.publicUrl}
              alt={bioPhoto.altText ?? settings.brand?.name ?? "Portrait"}
              fill
              priority
              sizes="(min-width: 768px) 33vw, 100vw"
              className="rounded-lg object-cover"
            />
          </div>
        )}
      </header>

      <section className="mb-16">
        <h2 className="font-display text-2xl text-ink mb-6">Skills</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
            <div key={category} className="bg-shell rounded-lg p-6">
              <h3 className="font-semibold text-ink mb-4">{category}</h3>
              <ul className="space-y-2 text-graphite">
                {categorySkills.map((skill) => (
                  <li key={skill.id} className="flex items-center gap-2">
                    <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-accent" />
                    {skill.name}
                    {skill.proficiency ? (
                      <span className="ml-auto text-xs text-muted">
                        {skill.proficiency}/5
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="values-heading">
        <h2 id="values-heading" className="font-display text-2xl text-ink mb-6">
          Values
        </h2>
        <ul className="space-y-4 text-graphite max-w-2xl">
          <li className="flex gap-3"><span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />Write code that is easy to delete, not just easy to extend.</li>
          <li className="flex gap-3"><span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />Optimize for readability; the next reader might be you in six months.</li>
          <li className="flex gap-3"><span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />Ship small, learn fast, iterate.</li>
          <li className="flex gap-3"><span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />Accessibility and performance are features, not afterthoughts.</li>
        </ul>
      </section>
    </Container>
  );
}