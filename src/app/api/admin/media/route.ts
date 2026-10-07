import { NextResponse } from "next/server";
import { requireAdmin, isUnauthorized, unauthorizedResponse } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { mediaAssets } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { deleteObject, uploadImage } from "@/lib/storage";
import { imageDimensionsSchema, validateImageFile } from "@/lib/validation/upload";

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
    if (isUnauthorized(error)) return unauthorizedResponse();
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

    // Dimensions are optional so a client that cannot decode the image still
    // uploads it: the row then has no ratio and pages fall back to a
    // hardcoded one. Present-but-unusable is still rejected rather than
    // quietly stored, or a typo would become a silently broken aspect ratio.
    const rawWidth = formData.get("width");
    const rawHeight = formData.get("height");
    const hasDimensions = rawWidth !== null && rawHeight !== null;
    const parsedDimensions = hasDimensions
      ? imageDimensionsSchema.safeParse({ width: rawWidth, height: rawHeight })
      : null;
    if (parsedDimensions && !parsedDimensions.success) {
      return NextResponse.json(
        {
          error: `Image rejected: ${
            parsedDimensions.error.issues[0]?.message ?? "invalid dimensions"
          }`,
        },
        { status: 400 }
      );
    }
    const dimensions = parsedDimensions?.success ? parsedDimensions.data : null;

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
          width: dimensions?.width ?? null,
          height: dimensions?.height ?? null,
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
    if (isUnauthorized(error)) return unauthorizedResponse();
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
