import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { experiences } from "@/lib/db/schema";
import { z } from "zod";

const experienceSchema = z.object({
  roleTitle: z.string().min(1).max(200),
  organization: z.string().min(1).max(200),
  startDate: z.string().date(),
  endDate: z.string().date().optional().nullable(),
  description: z.string().min(1),
  type: z.enum(["work", "education", "certification"]),
  sortOrder: z.number().int().default(0),
});

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = experienceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const [exp] = await db.insert(experiences).values(parsed.data).returning();
    return NextResponse.json(exp, { status: 201 });
  } catch (error) {
    console.error("create experience error:", error);
    return NextResponse.json({ error: "Failed to create experience" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Use GET /admin/experience" }, { status: 404 });
}