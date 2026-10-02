import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { insertActiveCv } from "@/lib/db/cv";
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

    // Upload to Supabase Storage private bucket goes in lib/storage
    // (see design.md §5); metadata insert stays here for now.
    await insertActiveCv({ storagePath, originalFilename: file.name });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("CV upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}