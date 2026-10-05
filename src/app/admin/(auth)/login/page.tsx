import { Container } from "@/components/ui/container";
import { LoginForm } from "@/components/admin/login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) {
  // Read here rather than in the client with useSearchParams: the value only
  // has to reach the form as a hidden field, and the server action is what
  // decides whether it is an acceptable redirect destination.
  const raw = (await searchParams).callbackUrl;
  const callbackUrl = typeof raw === "string" ? raw : undefined;

  return (
    <Container className="flex flex-1 flex-col justify-center py-12">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl text-ink mb-8 text-center">Sign in to admin</h1>
        <LoginForm callbackUrl={callbackUrl} />
      </div>
    </Container>
  );
}
