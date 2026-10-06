import { config } from "dotenv";

// Next.js reads .env.local, so the seed has to read the same file or
// `pnpm db:seed` runs with an empty DATABASE_URL (same reason as
// drizzle.config.ts).
config({ path: ".env.local" });

import { closeDb, db } from "@/lib/db";
import {
  users,
  projects,
  experiences,
  skills,
  testimonials,
  siteSettings,
  mediaAssets,
  projectGallery,
  contactSubmissions,
} from "@/lib/db/schema";
import { uploadImage } from "@/lib/storage";
import { solidPng } from "./lib/png";
import { hash } from "bcryptjs";
import { eq, inArray } from "drizzle-orm";

/**
 * Every table uses uuid primary keys, so the sample rows need real uuids.
 * They are fixed values rather than random ones: `onConflictDoNothing` can
 * only make the seed re-runnable when the same row always asks for the same
 * primary key.
 */
const ID = {
  media: {
    project1Cover: "1f000000-0000-4000-8000-000000000001",
    project2Cover: "1f000000-0000-4000-8000-000000000002",
    avatar1: "1f000000-0000-4000-8000-000000000003",
  },
  project1: "2f000000-0000-4000-8000-000000000001",
  project2: "2f000000-0000-4000-8000-000000000002",
  experience1: "3f000000-0000-4000-8000-000000000001",
  experience2: "3f000000-0000-4000-8000-000000000002",
  experience3: "3f000000-0000-4000-8000-000000000003",
  skills: [
    "4f000000-0000-4000-8000-000000000001",
    "4f000000-0000-4000-8000-000000000002",
    "4f000000-0000-4000-8000-000000000003",
    "4f000000-0000-4000-8000-000000000004",
    "4f000000-0000-4000-8000-000000000005",
    "4f000000-0000-4000-8000-000000000006",
  ],
  testimonial1: "5f000000-0000-4000-8000-000000000001",
  contact1: "6f000000-0000-4000-8000-000000000001",
} as const;

/**
 * Sample media, uploaded to the public image bucket on first run and reused
 * afterwards. Re-uploading every time would leave an orphaned object behind
 * for each seed run, since storage keys are uuid-prefixed.
 */
const MEDIA = [
  {
    id: ID.media.project1Cover,
    file: "ecommerce-platform-cover.png",
    altText: "Storefront of the e-commerce platform project",
    width: 1200,
    height: 800,
    top: [15, 23, 42] as [number, number, number],
    bottom: [37, 99, 235] as [number, number, number],
  },
  {
    id: ID.media.project2Cover,
    file: "task-manager-cover.png",
    altText: "Kanban board of the task management app project",
    width: 1200,
    height: 800,
    top: [12, 34, 40] as [number, number, number],
    bottom: [13, 148, 136] as [number, number, number],
  },
  {
    id: ID.media.avatar1,
    file: "jane-smith-avatar.png",
    altText: "Portrait of Jane Smith",
    width: 256,
    height: 256,
    top: [55, 65, 81] as [number, number, number],
    bottom: [156, 163, 175] as [number, number, number],
  },
];

async function seedMedia() {
  const existing = await db
    .select()
    .from(mediaAssets)
    .where(inArray(mediaAssets.id, MEDIA.map((m) => m.id)));

  for (const asset of MEDIA) {
    const already = existing.find((row) => row.id === asset.id);
    if (already) {
      console.log(`  media ${asset.file} already present, reusing ${already.publicUrl}`);
      continue;
    }

    const bytes = solidPng(asset.width, asset.height, asset.top, asset.bottom);
    const file = new File([new Uint8Array(bytes)], asset.file, { type: "image/png" });
    const { storagePath, publicUrl } = await uploadImage(file);

    await db.insert(mediaAssets).values({
      id: asset.id,
      storagePath,
      publicUrl,
      altText: asset.altText,
      mimeType: "image/png",
      sizeBytes: bytes.byteLength,
      // The PNGs are generated at a known size, so the seed knows its ratios
      // exactly. Recording them keeps the seeded public pages on the recorded
      // ratio path (#90) instead of the MediaFrame fallback.
      width: asset.width,
      height: asset.height,
    });
    console.log(`  media ${asset.file} -> ${publicUrl}`);
  }
}

async function seed() {
  console.log("Seeding database...");

  const passwordHash = await hash("changeme123", 10);
  const [user] = await db
    .insert(users)
    .values({
      email: "admin@piregi.dev",
      passwordHash,
      name: "Peter Iregi",
      role: "admin",
    })
    .onConflictDoNothing()
    .returning({ id: users.id });
  const userId =
    user?.id ??
    (await db.select({ id: users.id }).from(users).where(eq(users.email, "admin@piregi.dev")).limit(1))[0].id;

  console.log("Admin user:", userId);

  await seedMedia();

  const projectsData = [
    {
      id: ID.project1,
      title: "E-commerce Platform",
      slug: "ecommerce-platform",
      summary: "Full-stack e-commerce solution with real-time inventory.",
      description:
        "Built a scalable e-commerce platform with Next.js, PostgreSQL, and Stripe integration. Features include real-time inventory management, order tracking, and admin dashboard.",
      coverMediaId: ID.media.project1Cover,
      techStack: ["Next.js", "PostgreSQL", "Stripe", "Tailwind"],
      tags: ["full-stack", "e-commerce"],
      projectUrl: "https://example.com",
      repoUrl: "https://github.com/example",
      status: "published" as const,
    },
    {
      id: ID.project2,
      title: "Task Management App",
      slug: "task-management-app",
      summary: "Collaborative task manager with real-time updates.",
      description:
        "A modern task management application with drag-and-drop boards, team workspaces, and WebSocket-based real-time collaboration.",
      coverMediaId: ID.media.project2Cover,
      techStack: ["React", "Node.js", "Socket.io", "MongoDB"],
      tags: ["productivity", "real-time"],
      projectUrl: "https://example.com",
      repoUrl: "https://github.com/example",
      status: "published" as const,
    },
  ];

  for (const p of projectsData) {
    await db.insert(projects).values(p).onConflictDoNothing();
  }
  console.log("Created projects");

  await db
    .insert(projectGallery)
    .values([
      { projectId: ID.project1, mediaId: ID.media.project1Cover, position: 0 },
      { projectId: ID.project2, mediaId: ID.media.project2Cover, position: 0 },
    ])
    .onConflictDoNothing();
  console.log("Created project gallery");

  const experiencesData = [
    {
      id: ID.experience1,
      roleTitle: "Senior Full Stack Developer",
      organization: "TechCorp Inc.",
      startDate: "2022-01-15",
      endDate: null,
      description:
        "Lead development of core platform features, mentor junior developers, architect scalable solutions.",
      type: "work" as const,
      sortOrder: 0,
    },
    {
      id: ID.experience2,
      roleTitle: "Full Stack Developer",
      organization: "StartupXYZ",
      startDate: "2019-06-01",
      endDate: "2022-01-10",
      description:
        "Built and maintained multiple client projects, implemented CI/CD pipelines.",
      type: "work" as const,
      sortOrder: 1,
    },
    {
      id: ID.experience3,
      roleTitle: "BSc Computer Science",
      organization: "University of Technology",
      startDate: "2015-09-01",
      endDate: "2019-06-15",
      description: "Focus on distributed systems and software engineering.",
      type: "education" as const,
      sortOrder: 2,
    },
  ];

  for (const e of experiencesData) {
    await db.insert(experiences).values(e).onConflictDoNothing();
  }
  console.log("Created experiences");

  const skillsData = [
    { id: ID.skills[0], name: "TypeScript", category: "Languages", proficiency: 5 },
    { id: ID.skills[1], name: "React", category: "Frontend", proficiency: 5 },
    { id: ID.skills[2], name: "Node.js", category: "Backend", proficiency: 5 },
    { id: ID.skills[3], name: "PostgreSQL", category: "Databases", proficiency: 4 },
    { id: ID.skills[4], name: "AWS", category: "Cloud", proficiency: 3 },
    { id: ID.skills[5], name: "Docker", category: "DevOps", proficiency: 4 },
  ];

  for (const s of skillsData) {
    await db.insert(skills).values(s).onConflictDoNothing();
  }
  console.log("Created skills");

  const testimonialsData = [
    {
      id: ID.testimonial1,
      authorName: "Jane Smith",
      authorTitle: "CTO",
      company: "TechCorp Inc.",
      quote:
        "Peter delivers high-quality code and thinks deeply about architecture. A true asset to any team.",
      avatarMediaId: ID.media.avatar1,
      sortOrder: 0,
    },
  ];

  for (const t of testimonialsData) {
    await db.insert(testimonials).values(t).onConflictDoNothing();
  }
  console.log("Created testimonials");

  const settings = [
    {
      key: "meta",
      value: {
        title: "Peter Iregi — Full Stack Developer",
        description:
          "Portfolio of Peter Iregi, full stack developer specializing in React, Node.js, and cloud architecture.",
      },
    },
    {
      key: "socials",
      value: {
        github: "https://github.com/piregi",
        linkedin: "https://linkedin.com/in/piregi",
        email: "peter@piregi.dev",
      },
    },
    {
      key: "brand",
      value: {
        name: "Peter Iregi",
        tagline: "Full Stack Developer",
      },
    },
    {
      key: "bio",
      value: {
        photoMediaId: ID.media.avatar1,
      },
    },
  ];

  for (const s of settings) {
    await db.insert(siteSettings).values(s).onConflictDoNothing();
  }
  console.log("Created site settings");

  await db
    .insert(contactSubmissions)
    .values({
      id: ID.contact1,
      name: "Jane Doe",
      email: "jane@example.com",
      message: "I'd love to discuss a potential project with you.",
      status: "new",
    })
    .onConflictDoNothing();
  console.log("Created sample contact submission");

  console.log("Seeding complete!");
}

seed()
  .then(() => closeDb())
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error("Seed failed:", err);
    await closeDb().catch(() => {});
    process.exit(1);
  });
