import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { listExperiences } from "@/lib/db/queries/public";
import { siteUrl } from "@/lib/site-url";
import { StructuredData, breadcrumbSchema } from "@/components/site/structured-data";

export const metadata: Metadata = {
  title: "Experience | Piregi Portfolio",
  description: "Work history, education, and certifications, with dates and what each role involved.",
  alternates: { canonical: "/experience" },
};

const TYPE_LABEL: Record<string, string> = {
  work: "Work",
  education: "Education",
  certification: "Certification",
};

function formatMonthYear(value: string) {
  // Date-only columns parse as UTC midnight; without the UTC pin, a visitor
  // west of Greenwich sees the previous month.
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function ExperiencePage() {
  const experiences = await listExperiences();

  return (
    <Container className="py-16 lg:py-24">
      <StructuredData
        data={breadcrumbSchema(siteUrl(), [
          { name: "Home", path: "/" },
          { name: "Experience", path: "/experience" },
        ])}
      />

      <header className="mb-12 lg:mb-16">
        <h1 className="font-display text-4xl lg:text-5xl text-ink mb-4">Experience</h1>
        <p className="max-w-2xl text-lg leading-relaxed text-graphite">
          Where I&apos;ve been and what I&apos;ve learned along the way.
        </p>
      </header>

      {experiences.length === 0 ? (
        <p className="text-graphite py-12">No experience entries yet.</p>
      ) : (
        <ol className="space-y-10">
          {experiences.map((exp) => (
            <li key={exp.id} className="relative pl-8 md:pl-12 border-l-2 border-line">
              <div
                aria-hidden="true"
                className="absolute left-0 top-1.5 md:top-2 w-3 h-3 rounded-full bg-claret -translate-x-1/2"
              />
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-2">
                <div>
                  {/* The type is a plain label rather than a numbered marker:
                      the entries are not sequential steps. */}
                  <p className="text-xs uppercase tracking-wide text-graphite">
                    {TYPE_LABEL[exp.type] ?? exp.type}
                  </p>
                  <h2 className="font-display text-xl text-ink mt-1">{exp.roleTitle}</h2>
                  <p className="text-claret font-medium">{exp.organization}</p>
                </div>
                <time
                  className="text-sm text-graphite whitespace-nowrap"
                  dateTime={exp.endDate ? `${exp.startDate}/${exp.endDate}` : exp.startDate}
                >
                  {formatMonthYear(exp.startDate)}
                  {" – "}
                  {exp.endDate ? formatMonthYear(exp.endDate) : "Present"}
                </time>
              </div>
              <p className="text-graphite leading-relaxed">{exp.description}</p>
            </li>
          ))}
        </ol>
      )}
    </Container>
  );
}