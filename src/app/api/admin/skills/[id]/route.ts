import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { skills } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const [skill] = await db.select().from(skills).where(eq(skills.id, id)).limit(1);
    if (!skill) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(skill);
  } catch (error) {
    console.error("get skill error:", error);
    return NextResponse.json({ error: "Failed to fetch skill" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const skillSchema = z.object({
      name: z.string().min(1).max(100),
      category: z.string().min(1).max(100),
      proficiency: z.number().int().min(1).max(5).optional(),
    });
    const parsed = skillSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

    const [skill] = await db.update(skills).set(parsed.data).where(eq(skills.id, id)).returning();
    if (!skill) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(skill);
  } catch (error) {
    console.error("update skill error:", error);
    return NextResponse.json({ error: "Failed to update skill" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await db.delete(skills).where(eq(skills.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("delete skill error:", error);
    return NextResponse.json({ error: "Failed to delete skill" }, { status: 500 });
  }
}