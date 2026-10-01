import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { cvFiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    await db.transaction(async (tx) => {
      await tx.update(cvFiles).set({ isActive: false }).where(eq(cvFiles.isActive, true));
      await tx.update(cvFiles).set({ isActive: true }).where(eq(cvFiles.id, id));
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("activate CV error:", error);
    return NextResponse.json({ error: "Failed to activate CV" }, { status: 500 });
  }
}