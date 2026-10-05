import { Container } from "@/components/ui/container";

const linkClass =
  "hover:text-claret transition-colors rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-claret";

function NewTabHint() {
  return <span className="sr-only"> (opens in a new tab)</span>;
}

export function Footer({ socials, brand }: { socials?: { github?: string; linkedin?: string; email?: string }; brand?: { name?: string } }) {
  return (
    <footer className="border-t border-line bg-shell">
      <Container className="py-12 lg:py-16">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="font-display text-lg font-semibold text-ink mb-4">{brand?.name ?? "Piregi Portfolio"}</p>
            <p className="text-graphite text-sm leading-relaxed max-w-xs">
              Full stack developer building reliable, scalable software.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-ink mb-4">Connect</h2>
            <ul className="space-y-2 text-sm text-graphite">
              {socials?.github && (
                <li>
                  <a href={socials.github} target="_blank" rel="noopener noreferrer" className={`${linkClass} flex items-center gap-2`}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.536-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
                    GitHub
                    <NewTabHint />
                  </a>
                </li>
              )}
              {socials?.linkedin && (
                <li>
                  <a href={socials.linkedin} target="_blank" rel="noopener noreferrer" className={`${linkClass} flex items-center gap-2`}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.586 7 0v11z"/></svg>
                    LinkedIn
                    <NewTabHint />
                  </a>
                </li>
              )}
              {socials?.email && (
                <li>
                  <a href={`mailto:${socials.email}`} className={`${linkClass} flex items-center gap-2`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    Email
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div className="text-sm text-graphite">
            <p>&copy; {new Date().getFullYear()} Piregi Portfolio. All rights reserved.</p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
