"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn } from "@/lib/auth";
import { loginSchema } from "@/lib/validation/auth";
import type { LoginState } from "@/lib/validation/auth";

const DEFAULT_REDIRECT = "/admin";

/**
 * Post-login destination, read from the form rather than taken from
 * `src/proxy.ts`'s redirect. src/proxy.ts only ever sets a bare pathname, but
 * the value arrives as form data the browser controls, so anything can be put
 * there. A same-origin path is the only acceptable destination: `//host` and
 * `https://host` are absolute URLs that would turn a successful sign-in into an
 * open redirect, and browsers normalise `\` to `/`, so `/\host` slips through a
 * `/`-prefix check alone. Falling back to /admin is what an unusable value
 * gets, and matches what signIn() used to do unconditionally.
 */
function callbackUrlOrDefault(raw: FormDataEntryValue | null): string {
  if (typeof raw !== "string") return DEFAULT_REDIRECT;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) {
    return DEFAULT_REDIRECT;
  }
  return raw;
}

/**
 * Server-side half of the login form. Lives in actions/ rather than the
 * client component because Auth.js's signIn needs server-only modules
 * (next/headers) to read the client IP for rate limiting.
 */
export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors: LoginState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "email" || field === "password") {
        fieldErrors[field] ??= issue.message;
      }
    }
    return { error: null, fieldErrors };
  }

  let destination: string;

  try {
    // `redirect: false` so signIn() returns the destination instead of throwing
    // NEXT_REDIRECT at us. It still throws AuthError when authorize() returns
    // null, because next-auth's own catch only swallows the redirect for
    // requests carrying X-Auth-Return-Redirect, which a server-action call does
    // not.
    destination = await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
      redirectTo: callbackUrlOrDefault(formData.get("callbackUrl")),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // Deliberately vague: design.md §4 forbids disclosing whether the
      // email exists. authorize() returns null for a wrong password, an unknown
      // email and a throttled attempt alike (src/lib/auth/index.ts), so there is
      // no field to blame and nothing safe to disclose.
      return { error: "Those credentials were not accepted.", fieldErrors: {} };
    }

    // Anything else is a fault on our side (database down, misconfiguration).
    // Reporting it as a rejected password would tell the user to retype one
    // that was fine, so say what happened and keep the detail in the log.
    console.error("auth: sign-in failed outside the credentials check", error);
    return {
      error: "Sign in is unavailable right now. Please try again.",
      fieldErrors: {},
    };
  }

  // Outside the try on purpose: redirect() signals by throwing NEXT_REDIRECT,
  // and catching that is what turns a successful sign-in into a stuck form.
  redirect(destination);
}
