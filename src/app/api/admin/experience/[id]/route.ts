import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { experiences } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { experienceSchema } from "@/lib/validation/content";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    const [exp] = await db.select().from(experiences).where(eq(experiences.id, id)).limit(1);
    if (!exp) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(exp);
  } catch (error) {
    console.error("get experience error:", error);
    return NextResponse.json({ error: "Failed to fetch experience" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const requestBody = await req.json();

    const parsed = experienceSchema.safeParse(requestBody);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const [exp] = await db
      .update(experiences)
      .set({ ...parsed.data })
      .where(eq(experiences.id, id))
      .returning();

    if (!exp) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(exp);
  } catch (error) {
    console.error("update experience error:", error);
    return NextResponse.json({ error: "Failed to update experience" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await db.delete(experiences).where(eq(experiences.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("delete experience error:", error);
    return NextResponse.json({ error: "Failed to delete experience" }, { status: 500 });
  }
}