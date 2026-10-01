import { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { listExperiences } from "@/lib/db/queries/public";

export const metadata: Metadata = {
  title: "Experience | Piregi Portfolio",
};

export default async function ExperiencePage() {
  const experiences = await listExperiences();

  return (
    <Container className="py-16 lg:py-24">
      <header className="mb-12 lg:mb-16">
        <h1 className="font-display text-4xl lg:text-5xl text-ink mb-4">Experience</h1>
        <p className="max-w-2xl text-lg leading-relaxed text-graphite">
          Where I&apos;ve been and what I&apos;ve learned along the way.
        </p>
      </header>

      <div className="space-y-10">
        {experiences.map((exp) => (
          <article key={exp.id} className="relative pl-8 md:pl-12 border-l-2 border-line">
            <div className="absolute left-0 top-1 md:left-[-8px] md:top-2 w-3 h-3 rounded-full bg-claret -translate-x-1/2" />
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-2">
              <div>
                <h3 className="font-display text-xl text-ink">{exp.roleTitle}</h3>
                <p className="text-claret font-medium">{exp.organization}</p>
              </div>
              <time className="text-sm text-graphite whitespace-nowrap" dateTime={exp.startDate}>
                {new Date(exp.startDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                {exp.endDate ? ` &ndash; ${new Date(exp.endDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}` : " &ndash; Present"}
              </time>
            </div>
            <p className="text-graphite leading-relaxed">{exp.description}</p>
            <span className="inline-block mt-3 text-xs bg-claret/10 text-claret px-2 py-1 rounded capitalize">{exp.type}</span>
          </article>
        ))}
      </div>
    </Container>
  );
}