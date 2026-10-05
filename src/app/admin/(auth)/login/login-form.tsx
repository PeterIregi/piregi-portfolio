"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      // `result.ok` is the HTTP status, not "you are signed in": a rejected
      // attempt still comes back 200, carrying an error URL. Reading `ok` sends
      // a wrong password to /admin, which bounces straight back here with no
      // message shown. The error code is the only signal (next-auth/react).
      if (result && !result.error) {
        router.push(callbackUrl);
        router.refresh();
        return;
      }

      // authorize() returns null for a wrong password, an unknown email and a
      // throttled attempt alike (src/lib/auth/index.ts), so there is no field
      // to blame and nothing safe to disclose: one form-level message, no
      // aria-invalid, because marking "email" wrong when the password was is
      // both false and a hint (design.md §4).
      setError("Those credentials were not accepted.");
    } catch {
      setError("Sign in is unavailable right now. Please try again.");
    } finally {
      // Without this a thrown signIn leaves the button disabled for good.
      setLoading(false);
    }
  };

  return (
    <Container className="flex flex-1 flex-col justify-center py-12">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl text-ink mb-8 text-center">Sign in to admin</h1>

        {/* The container is always present and the message is injected into
            it, for the same reason as the contact form: a live region added
            to the DOM at the same moment as its text is unreliably announced,
            and nothing moves focus here on failure. */}
        <div role="alert">
          {error && (
            <div className="mb-6 p-4 rounded border border-accent bg-accent/10 text-accent text-sm">
              {error}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={loading}
          />

          <Input
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            disabled={loading}
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </Container>
  );
}