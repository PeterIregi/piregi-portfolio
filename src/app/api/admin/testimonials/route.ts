import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { testimonials } from "@/lib/db/schema";
import { testimonialSchema } from "@/lib/validation/content";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = testimonialSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

    const [t] = await db.insert(testimonials).values(parsed.data).returning();
    return NextResponse.json(t, { status: 201 });
  } catch (error) {
    console.error("create testimonial error:", error);
    return NextResponse.json({ error: "Failed to create testimonial" }, { status: 500 });
  }
}