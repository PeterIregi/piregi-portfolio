import { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { getSiteSettings, listSkills } from "@/lib/db/queries/public";

export const metadata: Metadata = {
  title: "About | Piregi Portfolio",
};

export default async function AboutPage() {
  const [settings, skills] = await Promise.all([getSiteSettings(), listSkills()]);

  const skillsByCategory = skills.reduce((acc, skill) => {
    (acc[skill.category] ??= []).push(skill);
    return acc;
  }, {} as Record<string, typeof skills>);

  return (
    <Container className="py-16 lg:py-24">
      <header className="mb-12 lg:mb-16">
        <h1 className="font-display text-4xl lg:text-5xl text-ink mb-4">About</h1>
        <p className="max-w-2xl text-lg leading-relaxed text-graphite">
          {settings.brand?.tagline ?? "Full Stack Developer"} passionate about building reliable, scalable software.
        </p>
      </header>

      <section className="mb-16">
        <h2 className="font-display text-2xl text-ink mb-6">Skills</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(skillsByCategory).map(([category, skills]) => (
            <div key={category} className="bg-shell rounded-lg p-6">
              <h3 className="font-semibold text-ink mb-4">{category}</h3>
              <ul className="space-y-2 text-graphite">
                {skills.map((skill) => (
                  <li key={skill.id} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-claret" />
                    {skill.name}
                    {skill.proficiency && (
                      <span className="ml-auto text-xs text-graphite/60">
                        {skill.proficiency}/5
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl text-ink mb-6">Values</h2>
        <ul className="space-y-4 text-graphite max-w-2xl">
          <li className="flex gap-3"><span className="w-1.5 h-1.5 rounded-full bg-claret mt-2 flex-shrink-0" />Write code that is easy to delete, not just easy to extend.</li>
          <li className="flex gap-3"><span className="w-1.5 h-1.5 rounded-full bg-claret mt-2 flex-shrink-0" />Optimize for readability; the next reader might be you in six months.</li>
          <li className="flex gap-3"><span className="w-1.5 h-1.5 rounded-full bg-claret mt-2 flex-shrink-0" />Ship small, learn fast, iterate.</li>
          <li className="flex gap-3"><span className="w-1.5 h-1.5 rounded-full bg-claret mt-2 flex-shrink-0" />Accessibility and performance are features, not afterthoughts.</li>
        </ul>
      </section>
    </Container>
  );
}