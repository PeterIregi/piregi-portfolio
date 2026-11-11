import { NextResponse } from "next/server";
import { requireAdmin, isUnauthorized, unauthorizedResponse } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { projects, projectGallery } from "@/lib/db/schema";
import { findMissingMediaIds } from "@/lib/db/media";
import { eq } from "drizzle-orm";
import { projectSchema } from "@/lib/validation/content";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);

    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // The edit form needs the ordered gallery ids, not just the project row,
    // or reopening it after a save would silently drop every plate.
    const gallery = await db
      .select({ mediaId: projectGallery.mediaId })
      .from(projectGallery)
      .where(eq(projectGallery.projectId, id))
      .orderBy(projectGallery.position);

    return NextResponse.json({
      ...project,
      galleryMediaIds: gallery.map((row) => row.mediaId),
    });
  } catch (error) {
    console.error("get project error:", error);
    if (isUnauthorized(error)) return unauthorizedResponse();
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const parsed = projectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    // Check slug uniqueness (excluding current project)
    const existing = await db
      .select()
      .from(projects)
      .where(eq(projects.slug, parsed.data.slug))
      .limit(1);

    if (existing.length > 0 && existing[0].id !== id) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    }

    const { galleryMediaIds, ...projectData } = parsed.data;
    const missing = await findMissingMediaIds([
      ...(projectData.coverMediaId ? [projectData.coverMediaId] : []),
      ...(galleryMediaIds ?? []),
    ]);
    if (missing.length > 0) {
      return NextResponse.json({ error: `Image not found: ${missing.join(", ")}` }, { status: 400 });
    }

    // Replace the gallery only when the caller sent a list, so an older client
    // that omits the field cannot wipe images it did not know about. Replacing
    // is delete-then-insert in one transaction; project_gallery has no row id
    // to update in place.
    const project = await db.transaction(async (tx) => {
      const [row] = await tx
        .update(projects)
        .set({ ...projectData, updatedAt: new Date() })
        .where(eq(projects.id, id))
        .returning();

      if (!row) return null;

      if (galleryMediaIds !== undefined) {
        await tx.delete(projectGallery).where(eq(projectGallery.projectId, id));
        if (galleryMediaIds.length > 0) {
          await tx.insert(projectGallery).values(
            galleryMediaIds.map((mediaId, position) => ({ projectId: id, mediaId, position }))
          );
        }
      }

      return row;
    });

    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("update project error:", error);
    if (isUnauthorized(error)) return unauthorizedResponse();
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    await db.delete(projects).where(eq(projects.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("delete project error:", error);
    if (isUnauthorized(error)) return unauthorizedResponse();
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}