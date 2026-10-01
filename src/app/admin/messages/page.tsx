import { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { getAllMessages } from "@/lib/db/queries/admin";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Messages | Admin",
};

export default async function AdminMessagesPage() {
  const messages = await getAllMessages();

  return (
    <Container className="py-8">
      <h1 className="font-display text-3xl text-ink mb-8">Messages</h1>

      {messages.length === 0 ? (
        <div className="bg-shell rounded-lg p-12 text-center">
          <p className="text-graphite">No messages yet.</p>
        </div>
      ) : (
        <div className="bg-shell rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left p-4 font-medium text-ink">Name</th>
                <th className="text-left p-4 font-medium text-ink">Email</th>
                <th className="text-left p-4 font-medium text-ink">Status</th>
                <th className="text-left p-4 font-medium text-ink">Received</th>
                <th className="text-right p-4 font-medium text-ink">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {messages.map((msg) => (
                <tr key={msg.id} className="hover:bg-claret/5">
                  <td className="p-4 font-medium text-ink">{msg.name}</td>
                  <td className="p-4 text-sm text-graphite">{msg.email}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      msg.status === "new" ? "bg-claret/10 text-claret" :
                      msg.status === "read" ? "bg-claret/10 text-claret" :
                      "bg-graphite/10 text-graphite"
                    }`}>
                      {msg.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-graphite">
                    {format(new Date(msg.submittedAt), "MMM d, yyyy HH:mm")}
                  </td>
                  <td className="p-4 text-right">
                    <a href={`/admin/messages/${msg.id}`} className="text-claret hover:text-claret-deep text-sm font-medium">
                      View
                    </a>
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