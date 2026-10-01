import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { skills } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const skillSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(100),
  proficiency: z.number().int().min(1).max(5).optional(),
});

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = skillSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const [skill] = await db.insert(skills).values(parsed.data).returning();
    return NextResponse.json(skill, { status: 201 });
  } catch (error) {
    console.error("create skill error:", error);
    return NextResponse.json({ error: "Failed to create skill" }, { status: 500 });
  }
}