import { redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/login-form";
import { Container } from "@/components/ui/container";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  // An already-authenticated admin has no business on the login page.
  const session = await auth();
  if (session?.user) redirect("/admin");

  return (
    <Container className="flex flex-1 items-center py-24">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-ink">Admin sign in</h1>
        <p className="mt-2 text-graphite">This area is for the site owner.</p>
        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </Container>
  );
}
