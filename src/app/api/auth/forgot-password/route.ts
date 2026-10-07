import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { siteUrl } from "@/lib/site-url";
import { checkPasswordResetRequestRateLimit, retryAfterSeconds } from "@/lib/auth/rate-limit";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = body?.email?.toLowerCase().trim();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    // Throttle before the user lookup so the limiter also covers the
    // enumeration guard's happy path (#98).
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const limit = checkPasswordResetRequestRateLimit(email, ip);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Try again later.", retryAfter: retryAfterSeconds(limit.resetAt) },
        { status: 429 }
      );
    }

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    // Always return success to avoid email enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }

    const token = uuidv4();
    const tokenHash = await hash(token, 10);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const resetUrl = `${siteUrl()}/admin/reset-password?token=${token}`;

    // Send email (will log to console in dev if RESEND_API_KEY not set)
    const { sendPasswordReset } = await import("@/lib/email");
    await sendPasswordReset(email, resetUrl);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("forgot-password error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}