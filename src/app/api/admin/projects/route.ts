import { NextResponse } from "next/server";
import { requireAdmin, isUnauthorized, unauthorizedResponse } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { projects, projectGallery } from "@/lib/db/schema";
import { findMissingMediaIds } from "@/lib/db/media";
import { eq } from "drizzle-orm";
import { projectSchema } from "@/lib/validation/content";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = projectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    // Check slug uniqueness
    const existing = await db.select().from(projects).where(eq(projects.slug, parsed.data.slug)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    }

    const { galleryMediaIds = [], ...projectData } = parsed.data;
    const missing = await findMissingMediaIds([
      ...(projectData.coverMediaId ? [projectData.coverMediaId] : []),
      ...galleryMediaIds,
    ]);
    if (missing.length > 0) {
      return NextResponse.json({ error: `Image not found: ${missing.join(", ")}` }, { status: 400 });
    }

    // Cover and gallery are one unit: a project must not be created with a
    // cover but a half-written gallery if an insert fails.
    const project = await db.transaction(async (tx) => {
      const [row] = await tx.insert(projects).values(projectData).returning();
      if (galleryMediaIds.length > 0) {
        await tx.insert(projectGallery).values(
          galleryMediaIds.map((mediaId, position) => ({ projectId: row.id, mediaId, position }))
        );
      }
      return row;
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("create project error:", error);
    if (isUnauthorized(error)) return unauthorizedResponse();
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}

export async function GET() {
  // Handled by the page
  return NextResponse.json({ error: "Use GET /admin/projects" }, { status: 404 });
}