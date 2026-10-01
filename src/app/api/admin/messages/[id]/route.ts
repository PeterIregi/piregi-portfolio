import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { contactSubmissions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["new", "read", "archived"]),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const parsed = statusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await db.update(contactSubmissions).set({ status: parsed.data.status }).where(eq(contactSubmissions.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("update message status error:", error);
    return NextResponse.json({ error: "Failed to update message" }, { status: 500 });
  }
}