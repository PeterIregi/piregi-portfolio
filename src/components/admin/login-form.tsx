"use client";

import { useActionState } from "react";

import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initialLoginState } from "@/lib/validation/auth";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialLoginState);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
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

      {state.error ? (
        <p role="alert" className="text-sm text-accent">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
