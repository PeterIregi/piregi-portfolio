import { compare } from "bcryptjs";
import { headers } from "next/headers";
import NextAuth from "next-auth";
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
