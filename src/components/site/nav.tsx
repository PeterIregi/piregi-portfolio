"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/site/theme-toggle";

const links = [
  { href: "/about", label: "About" },
  { href: "/projects", label: "Projects" },
  { href: "/experience", label: "Experience" },
  { href: "/contact", label: "Contact" },
];

// Shared by both nav renderings. `aria-current` is what tells a screen reader
// which page you are on; the accent text colour alone does not, and colour is
// the only thing distinguishing the active link visually.
function linkClasses(pathname: string, href: string) {
  const active = pathname === href;
  return [
    "rounded text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    active ? "text-accent" : "text-ink hover:text-accent",
  ].join(" ");
}

export function Nav({ cvHref = "/cv", brand }: { cvHref?: string; brand?: { name?: string; tagline?: string } }) {
  const pathname = usePathname();
  // The menu is keyed by the path it was opened on rather than being a plain
  // boolean: navigating changes pathname, which closes the panel on its own.
  // The header is sticky, so a panel left open covers the page just requested,
  // and a setState-in-effect would be the other way to do this.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = openedAt === pathname;

  return (
    <header className="border-b border-line sticky top-0 z-50 bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="font-display text-xl font-semibold text-ink hover:text-accent transition-colors rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {brand?.name ?? "Piregi Portfolio"}
        </Link>

        <nav aria-label="Main" className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={linkClasses(pathname, link.href)}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="primary" size="sm" href={cvHref} className="hidden sm:inline-flex">
            Download CV
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpenedAt(open ? null : pathname)}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </Button>
        </div>
      </Container>

      {/* Without this the primary navigation is unreachable on phones: the
          desktop nav is hidden below md and the footer carries social links
          only. */}
      {open && (
        <nav
          id="mobile-nav"
          aria-label="Main"
          className="md:hidden border-t border-line bg-paper"
        >
          <Container className="py-3 flex flex-col">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                className={`${linkClasses(pathname, link.href)} py-3`}
              >
                {link.label}
              </Link>
            ))}
            <Button variant="primary" size="sm" href={cvHref} className="mt-3 sm:hidden">
              Download CV
            </Button>
          </Container>
        </nav>
      )}
    </header>
  );
}
