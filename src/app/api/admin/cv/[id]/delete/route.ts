import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { deleteCv, getCvById, isCvIdDeletable } from "@/lib/db/cv";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    const existing = await getCvById(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (!(await isCvIdDeletable(id))) {
      return NextResponse.json({ error: "Cannot delete the active CV" }, { status: 400 });
    }

    // Delete from Supabase Storage goes in lib/storage (design.md §5).
    await deleteCv(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("delete CV error:", error);
    return NextResponse.json({ error: "Failed to delete CV" }, { status: 500 });
  }
}