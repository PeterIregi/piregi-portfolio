import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { getActiveCv } from "@/lib/db/queries/public";
import { siteUrl } from "@/lib/site-url";
import { StructuredData, breadcrumbSchema } from "@/components/site/structured-data";

export const metadata: Metadata = {
  title: "CV | Piregi Portfolio",
  description: "View or download the current CV, with the date it was last updated.",
  alternates: { canonical: "/cv" },
};

export default async function CvPage() {
  const cv = await getActiveCv();
  const lastUpdated = cv ? new Date(cv.uploadedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : null;

  return (
    <Container className="py-16 lg:py-24">
      <StructuredData
        data={breadcrumbSchema(siteUrl(), [
          { name: "Home", path: "/" },
          { name: "CV", path: "/cv" },
        ])}
      />

      <header className="mb-12 lg:mb-16">
        <h1 className="font-display text-4xl lg:text-5xl text-ink mb-4">Curriculum Vitae</h1>
        <p className="max-w-2xl text-lg leading-relaxed text-graphite">
          Download the current version of my CV.
        </p>
      </header>

      <div className="bg-shell rounded-lg p-8 max-w-2xl">
        {cv && lastUpdated ? (
          <>
            {/* The counter is deliberately not published: design.md §2/§4 keep
                download metrics admin-only, so only the date appears here. */}
            <p className="text-graphite mb-6">
              Last updated:{" "}
              <time dateTime={cv.uploadedAt.toISOString()}>{lastUpdated}</time>
            </p>
            <Button
              variant="primary"
              size="md"
              href={`/api/cv/download/${cv.id}`}
              className="w-full sm:w-auto"
            >
              Download CV
            </Button>
          </>
        ) : (
          <div className="py-12">
            <p className="text-graphite mb-4">No CV uploaded yet.</p>
            <p className="text-sm text-graphite/60">
              Check back later or get in touch through the contact page.
            </p>
          </div>
        )}
      </div>
    </Container>
  );
}