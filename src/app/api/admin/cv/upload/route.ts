import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { cvFiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.type !== "application/pdf") return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 });

    const storagePath = `cv/${uuidv4()}-${file.name.replace(/\s+/g, "-")}`;

    // In production, upload to Supabase Storage private bucket here
    // For now, store metadata
    await db.transaction(async (tx) => {
      // Deactivate all existing CVs
      await tx.update(cvFiles).set({ isActive: false }).where(eq(cvFiles.isActive, true));

      // Insert new CV as active
      await tx.insert(cvFiles).values({
        storagePath: `cv/${uuidv4()}-${file.name.replace(/\s+/g, "-")}`,
        originalFilename: file.name,
        isActive: true,
        downloadCount: 0,
      });
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("CV upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}