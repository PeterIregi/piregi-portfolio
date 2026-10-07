import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { passwordResetTokens, users } from "@/lib/db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import { hash } from "bcryptjs";
import { checkResetPasswordAttemptRateLimit, retryAfterSeconds } from "@/lib/auth/rate-limit";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // No more than a handful of submissions per IP per window, so an
    // attacker cannot brute-force a token offline (#98).
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const limit = checkResetPasswordAttemptRateLimit(ip);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Try again later.", retryAfter: retryAfterSeconds(limit.resetAt) },
        { status: 429 }
      );
    }

    const now = new Date();

    // Fetch all unexpired, unused tokens and check hash in memory
    const candidates = await db
      .select()
      .from(passwordResetTokens)
      .where(and(gt(passwordResetTokens.expiresAt, now), isNull(passwordResetTokens.usedAt)));

    const { compare } = await import("bcryptjs");
    let validToken = null;
    for (const candidate of candidates) {
      if (await compare(token, candidate.tokenHash)) {
        validToken = candidate;
        break;
      }
    }

    if (!validToken) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    const passwordHash = await hash(password, 10);

    await db.transaction(async (tx) => {
      await tx.update(users).set({ passwordHash }).where(eq(users.id, validToken.userId));
      await tx
        .update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(eq(passwordResetTokens.id, validToken.id));
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("reset-password error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}