import { Metadata } from "next";
import { Container } from "@/components/ui/container";
import Link from "next/link";
import { format } from "date-fns";
import { db } from "@/lib/db";
import { contactSubmissions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Message Detail | Admin",
};

export default async function MessageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const [msg] = await db.select().from(contactSubmissions).where(eq(contactSubmissions.id, id)).limit(1);

  if (!msg) {
    return <Container className="py-8"><p className="text-graphite">Message not found</p></Container>;
  }

  return (
    <Container className="py-8">
      <div className="mb-8">
        <Link href="/admin/messages" className="text-accent hover:text-accent-deep text-sm inline-block mb-4">
          ← Back to messages
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl text-ink">Message from {msg.name}</h1>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            msg.status === "new" ? "bg-accent/10 text-accent" :
            msg.status === "read" ? "bg-accent/10 text-accent" :
            "bg-graphite/10 text-graphite"
          }`}>
            {msg.status}
          </span>
        </div>
      </div>

      <div className="bg-shell rounded-lg p-6 space-y-4">
        <div>
          <p className="text-sm text-graphite">From</p>
          <p className="font-medium text-ink">{msg.name}</p>
        </div>
        <div>
          <p className="text-sm text-graphite">Email</p>
          <p className="font-medium text-ink">
            <a href={`mailto:${msg.email}`} className="text-accent hover:text-accent-deep">{msg.email}</a>
          </p>
        </div>
        <div>
          <p className="text-sm text-graphite">Received</p>
          <p className="text-ink">{format(new Date(msg.submittedAt), "MMMM d, yyyy HH:mm")}</p>
        </div>
        <div>
          <p className="text-sm text-graphite">Status</p>
          <select
            defaultValue={msg.status}
            onChange={(e) => {
              fetch(`/api/admin/messages/${msg.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: e.target.value }),
              });
            }}
            className="h-11 w-full max-w-xs rounded border border-edge bg-paper px-3.5 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <hr className="border-line" />
        <div>
          <p className="text-sm text-graphite mb-2">Message</p>
          <p className="text-ink whitespace-pre-wrap">{msg.message}</p>
        </div>
        <div className="flex gap-3 pt-4">
          <a href={`mailto:${msg.email}`} className="text-accent hover:text-accent-deep font-medium">
            Reply via email
          </a>
        </div>
      </div>
    </Container>
  );
}