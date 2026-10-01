import { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { listAllTestimonials } from "@/lib/db/queries/admin";

export const metadata: Metadata = {
  title: "Testimonials | Admin",
};

export default async function AdminTestimonialsPage() {
  const testimonials = await listAllTestimonials();

  return (
    <Container className="py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-ink">Testimonials</h1>
        <Link href="/admin/testimonials/new">
          <Button variant="primary">New Testimonial</Button>
        </Link>
      </div>

      {testimonials.length === 0 ? (
        <div className="bg-shell rounded-lg p-12 text-center">
          <p className="text-graphite mb-6">No testimonials yet.</p>
          <Link href="/admin/testimonials/new">
            <Button variant="primary">Add your first testimonial</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-shell rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left p-4 font-medium text-ink">Author</th>
                <th className="text-left p-4 font-medium text-ink">Company</th>
                <th className="text-left p-4 font-medium text-ink">Quote</th>
                <th className="text-right p-4 font-medium text-ink">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {testimonials.map((t) => (
                <tr key={t.id} className="hover:bg-claret/5">
                  <td className="p-4">
                    <p className="font-medium text-ink">{t.authorName}</p>
                    <p className="text-sm text-graphite">{t.authorTitle} {t.company ? `· ${t.company}` : ""}</p>
                  </td>
                  <td className="p-4 text-sm text-graphite max-w-md truncate">{t.quote}</td>
                  <td className="p-4 text-right">
                    <Link href={`/admin/testimonials/${t.id}/edit`} className="text-claret hover:text-claret-deep text-sm font-medium">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Container>
  );
}