import { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import {
  getSiteSettings,
  listPublishedProjects,
  listTestimonials,
} from "@/lib/db/queries/public";

export const metadata: Metadata = {
  title: "Piregi Portfolio",
  description: "Personal portfolio: work, experience, and a downloadable CV.",
};

export default async function HomePage() {
  const [settings, projects, testimonials] = await Promise.all([
    getSiteSettings(),
    listPublishedProjects(),
    listTestimonials(),
  ]);

  const featured = projects.slice(0, 3);
  const name = settings.brand?.name ?? "Peter Iregi";
  const tagline = settings.brand?.tagline ?? "Full Stack Developer";

  return (
    <div className="flex flex-col">
      <section className="relative py-24 lg:py-32" aria-labelledby="hero-heading">
        <Container>
          <header className="max-w-3xl mx-auto text-center">
            <h1 id="hero-heading" className="font-display text-5xl lg:text-6xl text-ink">
              {name}
            </h1>
            <p className="mt-4 text-xl lg:text-2xl text-graphite">{tagline}</p>
            <p className="mt-6 max-w-2xl mx-auto text-lg leading-relaxed text-graphite">
              I build reliable, scalable software with a focus on clean architecture and
              thoughtful user experiences.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button variant="primary" size="md" href="/projects">
                View Work
              </Button>
              <Button variant="secondary" size="md" href="/cv">
                Download CV
              </Button>
              <Button variant="ghost" size="md" href="/contact">
                Get in Touch
              </Button>
            </div>
          </header>
        </Container>
      </section>

      {featured.length > 0 && (
        <section className="py-16 lg:py-24 bg-shell" aria-labelledby="featured-heading">
          <Container>
            <header className="mb-12 lg:mb-16 max-w-2xl mx-auto text-center">
              <h2 id="featured-heading" className="font-display text-3xl lg:text-4xl text-ink mb-4">
                Featured Projects
              </h2>
              <p className="text-lg leading-relaxed text-graphite">
                A selection of recent work. Visit the projects page for the full list.
              </p>
            </header>

            <div className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
              {featured.map((project) => (
                <article key={project.id}>
                  {project.coverUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={project.coverUrl}
                      alt={project.coverAltText ?? ""}
                      className="aspect-[3/2] w-full rounded-lg object-cover"
                    />
                  ) : (
                    <div aria-hidden="true" className="aspect-[3/2] w-full rounded-lg bg-shell" />
                  )}
                  {/* The title is the link, matching /projects: an
                      arrow-suffixed CTA on every card is the generic tell
                      design.md §10 warns about. */}
                  <h3 className="mt-5 font-display text-xl text-ink">
                    <Link
                      href={`/projects/${project.slug}`}
                      className="hover:text-claret transition-colors"
                    >
                      {project.title}
                    </Link>
                  </h3>
                  <p className="mt-2 text-graphite">{project.summary}</p>
                  {project.techStack.length > 0 && (
                    <p className="mt-4 text-sm text-graphite">
                      {project.techStack.slice(0, 4).join(" · ")}
                    </p>
                  )}
                </article>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link href="/projects" className="text-claret hover:text-claret-deep font-medium inline-flex items-center gap-1">
                View all projects
              </Link>
            </div>
          </Container>
        </section>
      )}

      <section className="py-16 lg:py-24" aria-labelledby="summary-heading">
        <Container>
          <header className="mb-12 lg:mb-16 max-w-2xl mx-auto text-center">
            <h2 id="summary-heading" className="font-display text-3xl lg:text-4xl text-ink mb-4">
              What I Do
            </h2>
          </header>

          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto text-center">
            <article className="p-6">
              <span className="inline-block w-12 h-12 rounded-full bg-claret/10 flex items-center justify-center mx-auto mb-4 text-claret text-2xl" aria-hidden="true">
                &#128187;
              </span>
              <h3 className="font-display text-xl text-ink mb-2">Full-Stack Development</h3>
              <p className="text-graphite">End-to-end web applications with React, Node.js, and modern cloud infrastructure.</p>
            </article>
            <article className="p-6">
              <span className="inline-block w-12 h-12 rounded-full bg-claret/10 flex items-center justify-center mx-auto mb-4 text-claret text-2xl" aria-hidden="true">
                &#128165;
              </span>
              <h3 className="font-display text-xl text-ink mb-2">System Architecture</h3>
              <p className="text-graphite">Designing scalable, maintainable systems with clear boundaries and observable operations.</p>
            </article>
            <article className="p-6">
              <span className="inline-block w-12 h-12 rounded-full bg-claret/10 flex items-center justify-center mx-auto mb-4 text-claret text-2xl" aria-hidden="true">
                &#9989;
              </span>
              <h3 className="font-display text-xl text-ink mb-2">Quality & Delivery</h3>
              <p className="text-graphite">Automated testing, CI/CD pipelines, and pragmatic code reviews to ship with confidence.</p>
            </article>
          </div>
        </Container>
      </section>

      {testimonials.length > 0 && (
        <section className="py-16 lg:py-24 bg-shell" aria-labelledby="testimonials-heading">
          <Container>
            <header className="mb-12 lg:mb-16 max-w-2xl mx-auto text-center">
              <h2 id="testimonials-heading" className="font-display text-3xl lg:text-4xl text-ink mb-4">
                Testimonials
              </h2>
              <p className="text-lg leading-relaxed text-graphite">
                What colleagues and clients have to say.
              </p>
            </header>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
              {testimonials.map((testimonial) => (
                <article key={testimonial.id} className="bg-paper rounded-lg border border-line p-6">
                  <blockquote className="text-graphite leading-relaxed mb-4">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                  <footer className="flex items-center gap-3">
                    {testimonial.avatarUrl && (
                      <div className="w-10 h-10 rounded-full bg-shell flex items-center justify-center overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={testimonial.avatarUrl}
                          alt={testimonial.avatarAltText ?? testimonial.authorName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-ink">{testimonial.authorName}</p>
                      <p className="text-sm text-graphite">
                        {testimonial.authorTitle}
                        {testimonial.company && `, ${testimonial.company}`}
                      </p>
                    </div>
                  </footer>
                </article>
              ))}
            </div>
          </Container>
        </section>
      )}
    </div>
  );
}
