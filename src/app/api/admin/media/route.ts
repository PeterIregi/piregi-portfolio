import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { mediaAssets } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { deleteObject, uploadImage } from "@/lib/storage";
import { validateImageFile } from "@/lib/validation/upload";

export async function GET() {
  try {
    await requireAdmin();

    const images = await db
      .select()
      .from(mediaAssets)
      .orderBy(desc(mediaAssets.uploadedAt));

    return NextResponse.json(images);
  } catch (error) {
    console.error("list media error:", error);
    return NextResponse.json({ error: "Failed to load images" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const formData = await req.formData();

    const file = formData.get("file");
    const rejection = validateImageFile(file instanceof File ? file : null);
    if (rejection) {
      return NextResponse.json({ error: `Image rejected: ${rejection}` }, { status: 400 });
    }

    const validated = file as File;
    const altText = formData.get("altText");
    const { storagePath, publicUrl } = await uploadImage(validated);

    try {
      const [asset] = await db
        .insert(mediaAssets)
        .values({
          storagePath,
          publicUrl,
          altText: typeof altText === "string" && altText.trim() ? altText.trim() : null,
          mimeType: validated.type,
          sizeBytes: validated.size,
        })
        .returning();

      return NextResponse.json(asset, { status: 201 });
    } catch (error) {
      // Same reasoning as the CV upload: a row-less object can never be
      // listed or deleted from the admin, so unwind it.
      await deleteObject(storagePath, "cv-images").catch(() => {});
      throw error;
    }
  } catch (error) {
    console.error("upload media error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
