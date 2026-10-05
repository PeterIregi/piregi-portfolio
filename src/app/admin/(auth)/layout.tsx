import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | Piregi Portfolio",
};

// Deliberately unguarded. The auth pages have to render for exactly the
// visitors who have no session, so they cannot sit under the layout that
// calls requireAdmin() (design.md §4 puts the guard in the handler, not
// here). The guarded shell lives in app/admin/(app)/layout.tsx.
export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center bg-paper p-6">{children}</div>;
}