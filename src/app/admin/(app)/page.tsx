import { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getDashboardStats, listRecentMessages } from "@/lib/db/queries/admin";

export const metadata: Metadata = {
  title: "Dashboard | Admin",
};

export default async function AdminDashboard() {
  const [stats, recentMessages] = await Promise.all([
    getDashboardStats(),
    listRecentMessages(5),
  ]);

  return (
    <Container className="py-8">
      <header className="mb-8">
        <h1 className="font-display text-3xl text-ink">Dashboard</h1>
        <p className="text-graphite mt-2">Overview of your portfolio activity</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-shell rounded-lg p-6">
          <h3 className="font-semibold text-ink mb-2">Published Projects</h3>
          <p className="font-display text-3xl text-ink">{stats.publishedProjects}</p>
        </div>
        <div className="bg-shell rounded-lg p-6">
          <h3 className="font-semibold text-ink mb-2">New Messages</h3>
          <p className="font-display text-3xl text-accent">{stats.newMessages}</p>
        </div>
        <div className="bg-shell rounded-lg p-6">
          <h3 className="font-semibold text-ink mb-2">CV Downloads</h3>
          <p className="font-display text-3xl text-ink">{stats.totalCvDownloads}</p>
        </div>
        <div className="bg-shell rounded-lg p-6">
          <h3 className="font-semibold text-ink mb-2">Visits (30 days)</h3>
          <p className="font-display text-3xl text-ink">{stats.visitsLast30Days}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="bg-shell rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-ink">Recent Messages</h2>
            <Link href="/admin/messages" className="text-sm text-accent hover:text-accent-deep">
              View all →
            </Link>
          </div>
          <div className="space-y-4">
            {recentMessages.length === 0 ? (
              <p className="text-graphite text-center py-4">No messages yet.</p>
            ) : (
              <>
                {recentMessages.map((msg) => (
                  <article key={msg.id} className="bg-paper rounded p-4 border border-line">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-ink">{msg.name}</p>
                      <time className="text-sm text-graphite" dateTime={msg.submittedAt.toISOString()}>
                        {new Date(msg.submittedAt).toLocaleDateString()}
                      </time>
                    </div>
                    <p className="text-sm text-graphite line-clamp-2">{msg.message}</p>
                    <a href={`/admin/messages/${msg.id}`} className="text-sm text-accent hover:text-accent-deep inline-block mt-2">
                      View →
                    </a>
                  </article>
                ))}
              </>
            )}
          </div>
        </section>

        <section className="bg-shell rounded-lg p-6">
          <h2 className="font-display text-xl text-ink mb-4">Quick Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/admin/projects/new">
              <Button variant="secondary" className="w-full justify-start">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                New Project
              </Button>
            </Link>
            <Link href="/admin/cv">
              <Button variant="secondary" className="w-full justify-start">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a.5.5 0 01-.707 0L3.172 9.999a.75.75 0 010-1.06l7.5-7.5a.75.75 0 011.06 0l7.5 7.5a.75.75 0 010 1.06l-2.25 2.25" /></svg>
                Manage CV
              </Button>
            </Link>
            <Link href="/admin/media">
              <Button variant="secondary" className="w-full justify-start">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
                Upload Media
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button variant="secondary" className="w-full justify-start">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 001.065 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 001.065 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-1.065 2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
                Settings
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </Container>
  );
}