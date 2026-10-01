import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { mediaAssets } from "@/lib/db/schema";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Only images allowed" }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });

    const id = uuidv4();
    const storagePath = `media/${id}-${file.name.replace(/\s+/g, "-")}`;

    // In production, upload to Supabase Storage here
    // For now, we just store the metadata
    const [asset] = await db.insert(mediaAssets).values({
      id: uuidv4(),
      storagePath,
      publicUrl: `/uploads/${storagePath}`, // placeholder
      altText: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    }).returning();

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error("upload media error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function GET() {
  // Handled by the page
  return NextResponse.json({ error: "Use GET /admin/media" }, { status: 404 });
}