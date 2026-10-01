"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/lib/auth";
import { loginSchema } from "@/lib/validation/auth";
import type { LoginState } from "@/lib/validation/auth";

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

  try {
    // Throws NEXT_REDIRECT on success; it must not be caught here or the
    // redirect turns into a stuck form.
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/admin",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // Deliberately vague: design.md §4 forbids disclosing whether the
      // email exists.
      return { error: "Those credentials were not accepted.", fieldErrors: {} };
    }
    throw error;
  }

  return { error: null, fieldErrors: {} };
}
