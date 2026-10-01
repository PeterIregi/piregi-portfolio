"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/site/theme-toggle";

export function Nav({ cvHref = "/cv", brand }: { cvHref?: string; brand?: { name?: string; tagline?: string } }) {
  const pathname = usePathname();

  return (
    <header className="border-b border-line sticky top-0 z-50 bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="font-display text-xl font-semibold text-ink hover:text-claret transition-colors" aria-label="Home">
          {brand?.name ?? "Piregi Portfolio"}
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/about" className={`text-sm font-medium transition-colors ${pathname === "/about" ? "text-claret" : "text-ink hover:text-claret"}`}>
            About
          </Link>
          <Link href="/projects" className={`text-sm font-medium transition-colors ${pathname === "/projects" ? "text-claret" : "text-ink hover:text-claret"}`}>
            Projects
          </Link>
          <Link href="/experience" className={`text-sm font-medium transition-colors ${pathname === "/experience" ? "text-claret" : "text-ink hover:text-claret"}`}>
            Experience
          </Link>
          <Link href="/contact" className={`text-sm font-medium transition-colors ${pathname === "/contact" ? "text-claret" : "text-ink hover:text-claret"}`}>
            Contact
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="primary" size="sm" href={cvHref} className="hidden sm:inline-flex">
            Download CV
          </Button>
        </div>
      </Container>
    </header>
  );
}