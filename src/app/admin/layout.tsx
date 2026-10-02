import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/guards";
import { AdminSidebar } from "@/components/admin/sidebar";

export const metadata: Metadata = {
  title: "Admin | Piregi Portfolio",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return (
    <div className="flex h-screen bg-paper">
      <AdminSidebar user={user} />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
    </div>
  );
}