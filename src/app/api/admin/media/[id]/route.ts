import { NextResponse } from "next/server";
import { requireAdmin, isUnauthorized, unauthorizedResponse } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { mediaAssets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { deleteObject } from "@/lib/storage";
import { mediaAltTextSchema } from "@/lib/validation/media";

// Alt text is the only mutable field on an asset. The image bytes, public
// URL and dimensions are immutable; correcting alt text is the WCAG 2.1 AA
// remediation path for an asset uploaded without it (#99).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await req.json().catch(() => null);
    const parsed = mediaAltTextSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        {
          error: `Alt text rejected: ${issue?.message ?? "invalid value"}`,
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const trimmed = parsed.data.altText.trim();
    const [asset] = await db
      .update(mediaAssets)
      .set({ altText: trimmed ? trimmed : null })
      .where(eq(mediaAssets.id, id))
      .returning();

    if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(asset);
  } catch (error) {
    console.error("update media alt text error:", error);
    return NextResponse.json({ error: "Failed to update alt text" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    const [asset] = await db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.id, id))
      .limit(1);

    if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Object before row, for the same reason as the CV delete: a row with a
    // dead public URL is a visible broken image.
    await deleteObject(asset.storagePath, "cv-images");
    await db.delete(mediaAssets).where(eq(mediaAssets.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("delete media error:", error);
    if (isUnauthorized(error)) return unauthorizedResponse();
    return NextResponse.json({ error: "Failed to delete media" }, { status: 500 });
  }
}
