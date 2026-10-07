import { compare } from "bcryptjs";
import { headers } from "next/headers";
import NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { checkLoginRateLimit } from "./rate-limit";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    // design.md §4: httpOnly, Secure, SameSite=Lax, 7-day expiry. Auth.js
    // defaults the cookie flags; only the lifetime is set here.
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  callbacks: {
    // Stamp the JWT with the users.token_version it was signed at, and on
    // every later use confirm the account's version still matches. A
    // password reset bumps the column (src/app/api/auth/reset-password),
    // so a pre-reset JWT detects the change and returns null, which in
    // @auth/core invalidates the token: the cookie is cleared and auth()
    // resolves to null, so requireAdmin() keys off an unauthenticated
    // session. Design.md §4: resetting the password revokes sessions.
    async jwt({ token, user }) {
      const jwtToken = token as JWT & { tokenVersion: number };
      if (!user) {
        if (!token.sub) return jwtToken;
        const [row] = await db
          .select({ tokenVersion: users.tokenVersion })
          .from(users)
          .where(eq(users.id, String(token.sub)))
          .limit(1)
          .catch((error: unknown) => {
            // Fail closed: a DB read error must not keep a possibly
            // revoked session alive.
            console.error("auth: failed to read token version", error);
            return [];
          });
        return row && row.tokenVersion === jwtToken.tokenVersion ? jwtToken : null;
      }

      // Sign-in: the DB is reachable (authorize just read it) so fail
      // closed on a version read error rather than sign a token without one.
      const [row] = await db
        .select({ tokenVersion: users.tokenVersion })
        .from(users)
        .where(eq(users.id, String(user.id)))
        .limit(1)
        .catch((error: unknown) => {
          console.error("auth: failed to read token version", error);
          return [];
        });
      if (!row) return null;
      return { ...jwtToken, tokenVersion: row.tokenVersion };
    },
  },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    Credentials({
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const email = typeof raw?.email === "string" ? raw.email.trim() : "";
        const password = typeof raw?.password === "string" ? raw.password : "";

        if (!email || !password) return null;

        const headerList = await headers();
        const ip =
          headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          headerList.get("x-real-ip") ??
          null;

        // Throttle before the hash comparison (design.md §4).
        const limit = checkLoginRateLimit(email, ip);
        if (!limit.allowed) return null;

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!user) return null;

        const valid = await compare(password, user.passwordHash);
        if (!valid) return null;

        // Best-effort; a failed update must not block a valid login.
        await db
          .update(users)
          .set({ lastLogin: new Date() })
          .where(eq(users.id, user.id))
          .catch((error: unknown) => {
            console.error("auth: failed to update lastLogin", error);
          });

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
});
