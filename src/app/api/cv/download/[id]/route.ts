import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cvFiles } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { getActiveCv } from "@/lib/db/cv";
import { getCvSignedPath } from "@/lib/storage";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Only the active version is downloadable: the private bucket stays
    // private and archived revisions can't be fetched by guessing an id
    // (design.md §4).
    const cv = await getActiveCv();
    if (!cv || cv.id !== id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Sign before counting: a failed signature must not inflate the
    // download count, but the increment itself is never read-modify-write.
    const signedUrl = await getCvSignedPath(cv.storagePath);

    // Atomic increment (design.md §7: never read-modify-write).
    await db
      .update(cvFiles)
      .set({ downloadCount: sql`${cvFiles.downloadCount} + 1` })
      .where(eq(cvFiles.id, cv.id));

    return NextResponse.redirect(signedUrl, { status: 302 });
  } catch (error) {
    console.error("CV download error:", error);
    return NextResponse.json(
      { error: "Failed to process download" },
      { status: 500 }
    );
  }
}
