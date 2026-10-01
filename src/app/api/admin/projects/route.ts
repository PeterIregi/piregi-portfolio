import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const projectSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  summary: z.string().min(1).max(500),
  description: z.string().min(1),
  techStack: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  projectUrl: z.string().url().optional().or(z.literal("")),
  repoUrl: z.string().url().optional().or(z.literal("")),
  status: z.enum(["draft", "published"]).default("draft"),
});

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

    const [project] = await db.insert(projects).values(parsed.data).returning();
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("create project error:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  // Handled by the page
  return NextResponse.json({ error: "Use GET /admin/projects" }, { status: 404 });
}