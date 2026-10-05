import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/guards";
import { AdminSidebar } from "@/components/admin/sidebar";
import { SkipLink } from "@/components/ui/skip-link";

export const metadata: Metadata = {
  title: "Admin | Piregi Portfolio",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return (
    <div className="flex h-screen bg-paper">
      <SkipLink target="#admin-main" label="Skip to main content" />
      <AdminSidebar user={user} />
      <main id="admin-main" className="flex-1 overflow-y-auto p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
