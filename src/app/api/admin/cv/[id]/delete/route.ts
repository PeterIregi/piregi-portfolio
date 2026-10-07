import { NextResponse } from "next/server";
import { requireAdmin, isUnauthorized, unauthorizedResponse } from "@/lib/auth/guards";
import { deleteCv, getCvById, isCvIdDeletable } from "@/lib/db/cv";
import { deleteObject } from "@/lib/storage";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    const existing = await getCvById(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (!(await isCvIdDeletable(id))) {
      return NextResponse.json({ error: "Cannot delete the active CV" }, { status: 400 });
    }

    // Object first: a surviving row pointing at a deleted object looks
    // intact but 500s on download, whereas an orphaned object is invisible
    // and reaps nothing but bytes.
    await deleteObject(existing.storagePath, "cv-files");
    await deleteCv(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("delete CV error:", error);
    if (isUnauthorized(error)) return unauthorizedResponse();
    return NextResponse.json({ error: "Failed to delete CV" }, { status: 500 });
  }
}
