import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { passwordResetTokens, users } from "@/lib/db/schema";
import { eq, and, gt, isNull, sql } from "drizzle-orm";
import { hash } from "bcryptjs";

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

    const now = new Date();

    // Fetch all unexpired, unused tokens and check hash in memory
    const candidates = await db
      .select()
      .from(passwordResetTokens)
      .where(and(gt(passwordResetTokens.expiresAt, now), isNull(passwordResetTokens.usedAt)));

    const { compare } = await import("bcryptjs");
    const validToken = candidates.find((t) => compare(token, t.tokenHash));

    if (!validToken) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    const passwordHash = await hash(password, 10);

    await db.transaction(async (tx) => {
      // Keep a reset from leaving other issuance alive: all of the user's
      // reset tokens are spent, and the token version bumps so every
      // session signed before this reset stops validating (#97).
      await tx
        .update(users)
        .set({ passwordHash, tokenVersion: sql`${users.tokenVersion} + 1` })
        .where(eq(users.id, validToken.userId));
      await tx
        .update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(eq(passwordResetTokens.userId, validToken.userId));
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("reset-password error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}