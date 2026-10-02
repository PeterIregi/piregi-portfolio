import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cvFiles } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const [cv] = await db.select().from(cvFiles).where(eq(cvFiles.id, id)).limit(1);
    if (!cv) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Atomic increment (design.md §7: never read-modify-write).
    await db
      .update(cvFiles)
      .set({ downloadCount: sql`${cvFiles.downloadCount} + 1` })
      .where(eq(cvFiles.id, id));

    // TODO(lib/storage): replace with a redirect to a Supabase Storage
    // signed URL once src/lib/storage is implemented (design.md §5). Until
    // then, fail loudly rather than faking a file.
    return NextResponse.json(
      { error: "CV storage is not configured yet" },
      { status: 503 }
    );
  } catch (error) {
    console.error("CV download error:", error);
    return NextResponse.json({ error: "Failed to process download" }, { status: 500 });
  }
}