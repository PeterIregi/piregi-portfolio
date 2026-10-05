import { format } from "date-fns";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/guards";
import { listCvs } from "@/lib/db/cv";

export const metadata = {
  title: "CV Management | Admin",
};

export default async function AdminCvPage() {
  await requireAdmin();
  const cvs = await listCvs();

  return (
    <Container className="py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">CV Management</h1>
          <p className="text-graphite mt-2">Manage uploaded CV versions. Exactly one can be active.</p>
        </div>
        <Button variant="primary" href="/admin/cv/upload">Upload New CV</Button>
      </header>

      {cvs.length === 0 ? (
        <div className="bg-shell rounded-lg p-12 text-center">
          <p className="text-graphite mb-4">No CV uploaded yet.</p>
          <Button variant="primary" href="/admin/cv/upload">Upload your first CV</Button>
        </div>
      ) : (
        <div className="bg-shell rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-paper border-b border-line text-left text-graphite">
              <tr>
                <th className="px-4 py-3 font-medium">Filename</th>
                <th className="px-4 py-3 font-medium">Uploaded</th>
                <th className="px-4 py-3 font-medium">Downloads</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {cvs.map((cv) => (
                <tr key={cv.id}>
                  <td className="px-4 py-3 text-ink font-medium max-w-[16rem] truncate">{cv.originalFilename}</td>
                  <td className="px-4 py-3 text-graphite">
                    {format(new Date(cv.uploadedAt), "MMM d, yyyy HH:mm")}
                  </td>
                  <td className="px-4 py-3 text-graphite">{cv.downloadCount}</td>
                  <td className="px-4 py-3">
                    {cv.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-graphite/10 text-graphite">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {!cv.isActive && (
                      <form action={`/api/admin/cv/${cv.id}/activate`} method="POST" className="inline">
                        <button
                          type="submit"
                          className="text-accent hover:text-accent-deep font-medium mr-3"
                        >
                          Activate
                        </button>
                      </form>
                    )}
                    {!cv.isActive && (
                      <form action={`/api/admin/cv/${cv.id}/delete`} method="POST" className="inline">
                        <button
                          type="submit"
                          className="text-graphite hover:text-accent font-medium"
                        >
                          Delete
                        </button>
                      </form>
                    )}
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