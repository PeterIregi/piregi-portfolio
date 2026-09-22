import { Container } from "@/components/ui/container";

export default function Home() {
  return (
    <Container className="flex flex-1 flex-col justify-center py-24">
      <h1 className="font-display text-display text-ink">Piregi Portfolio</h1>
      <p className="mt-6 max-w-prose text-lg leading-relaxed text-graphite">
        Work, experience, and a current CV. Content arrives once the CMS is
        wired up.
      </p>
    </Container>
  );
}