import { NextResponse } from "next/server";
import { requireAdmin, isUnauthorized, unauthorizedResponse } from "@/lib/auth/guards";
import { insertActiveCv } from "@/lib/db/cv";
import { deleteObject, uploadCv } from "@/lib/storage";
import { validateCvFile } from "@/lib/validation/upload";

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const formData = await req.formData();
    const file = formData.get("file");
    const rejection = validateCvFile(file instanceof File ? file : null);
    if (rejection) {
      return NextResponse.json({ error: `CV rejected: ${rejection}` }, { status: 400 });
    }

    const validated = file as File;
    const storagePath = await uploadCv(validated);

    try {
      const cv = await insertActiveCv({ storagePath, originalFilename: validated.name });
      return NextResponse.json(cv, { status: 201 });
    } catch (error) {
      // The row is what makes the file reachable; without it the object is
      // an orphan nobody can ever delete, so unwind the upload.
      await deleteObject(storagePath, "cv-files").catch(() => {});
      throw error;
    }
  } catch (error) {
    console.error("CV upload error:", error);
    if (isUnauthorized(error)) return unauthorizedResponse();
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
