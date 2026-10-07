import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { getTestimonialById } from "@/lib/db/queries/admin";
import { TestimonialForm } from "@/components/admin/testimonial-form";

export default async function EditTestimonialPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { created } = await searchParams;

  const testimonial = await getTestimonialById(id);
  if (!testimonial) notFound();

  return (
    <TestimonialForm
      initial={{
        id: testimonial.id,
        authorName: testimonial.authorName,
        authorTitle: testimonial.authorTitle,
        company: testimonial.company,
        quote: testimonial.quote,
      }}
      created={created === "1"}
    />
  );
}
