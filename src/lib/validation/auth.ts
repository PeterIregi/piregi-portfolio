import { z } from "zod";

/**
 * Shared by the login form and the credentials provider's input handling
 * (AGENTS.md: one Zod schema per shape, defined once).
 */
export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Result shape returned by the login Server Action. Declared here, not in
 * actions/auth.ts, because a "use server" module may only export async
 * functions, so the initial state cannot live next to the action.
 */
export type LoginState = {
  error: string | null;
  fieldErrors: Partial<Record<"email" | "password", string>>;
};

export const initialLoginState: LoginState = { error: null, fieldErrors: {} };
