import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { cvFiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    const [cv] = await db.select().from(cvFiles).where(eq(cvFiles.id, id)).limit(1);
    if (!cv) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // In production, delete from Supabase Storage here

    await db.delete(cvFiles).where(eq(cvFiles.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("delete CV error:", error);
    return NextResponse.json({ error: "Failed to delete CV" }, { status: 500 });
  }
}