"use client";

import { useState } from "react";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";

export default function ForgotPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const success = searchParams.get("success");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Request failed");
      }

      router.push("/admin/forgot-password?success=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      setLoading(false);
    }
  };

  return (
    <Container className="flex flex-1 flex-col justify-center py-12">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl text-ink mb-8 text-center">Reset your password</h1>

        {success && (
          <div className="mb-6 p-4 rounded border border-graphite bg-shell text-graphite text-sm">
            If an account exists for that email, a reset link has been sent.
          </div>
        )}

        {!success && (
          <>
            <p className="mb-6 text-center text-graphite">
              Enter your email and we will send you a link to reset your password.
            </p>

            {error && (
              <div className="mb-6 p-4 rounded border border-accent bg-accent/10 text-accent text-sm">
                {error}
              </div>
            )}

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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-graphite">
          <a href="/admin/login" className="text-accent hover:text-accent-deep">
            Back to sign in
          </a>
        </p>
      </div>
    </Container>
  );
}