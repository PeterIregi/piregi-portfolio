import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cvFiles } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Atomic increment and fetch
    const [cv] = await db
      .update(cvFiles)
      .set({ downloadCount: sql`${cvFiles.downloadCount} + 1` })
      .where(eq(cvFiles.id, id))
      .returning();

    if (!cv) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // In production, serve from Supabase Storage signed URL
    // For now, return a placeholder
    return NextResponse.json({
      downloadUrl: `/cv-files/${cv.storagePath}`,
      filename: cv.originalFilename,
    });
  } catch (error) {
    console.error("CV download error:", error);
    return NextResponse.json({ error: "Failed to process download" }, { status: 500 });
  }
}