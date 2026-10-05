"use client";

import { useActionState } from "react";

import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initialLoginState } from "@/lib/validation/auth";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialLoginState);

  return (
    // noValidate is deliberate: the browser's own bubble would pre-empt the Zod
    // messages below, which name the field and are wired to it with
    // aria-describedby.
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {/* The container is always present and the message is injected into it,
          because a live region added to the DOM at the same moment as its text
          is unreliably announced, and nothing moves focus here on failure. */}
      <div role="alert">
        {state.error ? (
          <div className="mb-6 p-4 rounded border border-accent bg-accent/10 text-accent text-sm">
            {state.error}
          </div>
        ) : null}
      </div>

      <Input
        label="Email"
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        describedBy={state.fieldErrors.email ? "email-error" : undefined}
        invalid={Boolean(state.fieldErrors.email)}
      />
      {state.fieldErrors.email ? (
        <p id="email-error" className="text-sm text-accent">
          {state.fieldErrors.email}
        </p>
      ) : null}

      <Input
        label="Password"
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        describedBy={state.fieldErrors.password ? "password-error" : undefined}
        invalid={Boolean(state.fieldErrors.password)}
      />
      {state.fieldErrors.password ? (
        <p id="password-error" className="text-sm text-accent">
          {state.fieldErrors.password}
        </p>
      ) : null}

      {/* src/proxy.ts sends the visitor here with the path they asked for, so
          a deep link into /admin survives the detour through this page. The
          action validates it before using it as a redirect destination. */}
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? "/admin"} />

      <Button type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
