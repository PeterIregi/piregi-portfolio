import { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { getActiveCv } from "@/lib/db/queries/public";

export const metadata: Metadata = {
  title: "CV | Piregi Portfolio",
};

export default async function CvPage() {
  const cv = await getActiveCv();

  return (
    <Container className="py-16 lg:py-24">
      <header className="mb-12 lg:mb-16">
        <h1 className="font-display text-4xl lg:text-5xl text-ink mb-4">Curriculum Vitae</h1>
        <p className="max-w-2xl text-lg leading-relaxed text-graphite">
          Download the current version of my CV.
        </p>
      </header>

      <div className="bg-shell rounded-lg p-8 max-w-2xl">
        {cv ? (
          <>
            <p className="text-graphite mb-6">
              Last updated: <time dateTime={cv.uploadedAt.toISOString()}>{new Date(cv.uploadedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</time>
            </p>
            <p className="text-graphite mb-6">
              Downloaded {cv.downloadCount} time{cv.downloadCount !== 1 ? "s" : ""}.
            </p>
            <Button variant="primary" size="md" href={`/api/cv/download/${cv.id}`} className="w-full sm:w-auto">
              Download CV
            </Button>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-graphite mb-4">No CV uploaded yet.</p>
            <p className="text-sm text-graphite/60">Check back later or contact the site owner.</p>
          </div>
        )}
      </div>
    </Container>
  );
}