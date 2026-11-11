import { NextResponse } from "next/server";
import { requireAdmin, isUnauthorized, unauthorizedResponse } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { testimonials } from "@/lib/db/schema";
import { findMissingMediaIds } from "@/lib/db/media";
import { testimonialSchema } from "@/lib/validation/content";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = testimonialSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

    if (parsed.data.avatarMediaId) {
      const missing = await findMissingMediaIds([parsed.data.avatarMediaId]);
      if (missing.length > 0) {
        return NextResponse.json({ error: `Image not found: ${missing.join(", ")}` }, { status: 400 });
      }
    }

    const [t] = await db.insert(testimonials).values(parsed.data).returning();
    return NextResponse.json(t, { status: 201 });
  } catch (error) {
    console.error("create testimonial error:", error);
    if (isUnauthorized(error)) return unauthorizedResponse();
    return NextResponse.json({ error: "Failed to create testimonial" }, { status: 500 });
  }
}