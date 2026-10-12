import { config } from "dotenv";

// Next.js reads .env.local, so the seed has to read the same file or
// `pnpm db:seed` runs with an empty DATABASE_URL (same reason as
// drizzle.config.ts).
config({ path: ".env.local" });

import { closeDb, db } from "@/lib/db";
import {
  users,
  projects,
  skills,
  siteSettings,
  mediaAssets,
  projectGallery,
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
    projectCover: "1f000000-0000-4000-8000-000000000001",
    bioPhoto: "1f000000-0000-4000-8000-000000000003",
  },
  project: "2f000000-0000-4000-8000-000000000001",
  skills: [
    "4f000000-0000-4000-8000-000000000001",
    "4f000000-0000-4000-8000-000000000002",
    "4f000000-0000-4000-8000-000000000003",
    "4f000000-0000-4000-8000-000000000004",
  ],
} as const;

/**
 * Sample media, uploaded to the public image bucket on first run and reused
 * afterwards. Re-uploading every time would leave an orphaned object behind
 * for each seed run, since storage keys are uuid-prefixed.
 */
const MEDIA = [
  {
    id: ID.media.projectCover,
    file: "kiboswa-hms-cover.png",
    altText: "Dashboard view of the Kiboswa hospital management system",
    width: 1200,
    height: 800,
    top: [12, 48, 44] as [number, number, number],
    bottom: [13, 148, 136] as [number, number, number],
  },
  {
    id: ID.media.bioPhoto,
    file: "portrait-placeholder.png",
    altText: "Placeholder portrait",
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
      name: "Peter Iregi Gati",
      role: "admin",
    })
    .onConflictDoNothing()
    .returning({ id: users.id });
  const userId =
    user?.id ??
    (await db.select({ id: users.id }).from(users).where(eq(users.email, "admin@piregi.dev")).limit(1))[0].id;

  console.log("Admin user:", userId);

  await seedMedia();

  // Real project from the resume: the seed carries genuine content now, not
  // the sample placeholders that predated the handover of real details.
  const projectsData = [
    {
      id: ID.project,
      title: "Kiboswa HMS",
      slug: "kiboswa-hms",
      summary:
        "Hospital management system that coordinates healthcare operations and tracks patient care.",
      description:
        "Kiboswa HMS is a hospital management system that coordinates the operations in a healthcare facility. It facilitates smooth allocation of required resources and tracking of the progress of patients and the availability of resources for their treatment.\n\nThe system was built with Go on the backend and HTML, CSS, and vanilla JavaScript on the frontend.",
      coverMediaId: ID.media.projectCover,
      techStack: ["Go", "HTML", "CSS", "JavaScript"],
      tags: ["healthcare", "full-stack"],
      projectUrl: "https://khms.onrender.com/",
      repoUrl: null,
      status: "published" as const,
    },
  ];

  for (const p of projectsData) {
    await db.insert(projects).values(p).onConflictDoNothing();
  }
  console.log("Created projects");

  await db
    .insert(projectGallery)
    .values([{ projectId: ID.project, mediaId: ID.media.projectCover, position: 0 }])
    .onConflictDoNothing();
  console.log("Created project gallery");

  // Skills mirror the resume's "Technical Skills" section. Proficiency is
  // deliberately left unset: the resume does not rate them, and the About
  // page only renders the /5 value when a level is actually recorded.
  const skillsData = [
    { id: ID.skills[0], name: "Go", category: "Languages", proficiency: null },
    { id: ID.skills[1], name: "JavaScript", category: "Languages", proficiency: null },
    { id: ID.skills[2], name: "Git", category: "Tools & Technologies", proficiency: null },
    { id: ID.skills[3], name: "GitHub", category: "Tools & Technologies", proficiency: null },
  ];

  for (const s of skillsData) {
    await db.insert(skills).values(s).onConflictDoNothing();
  }
  console.log("Created skills");

  const settings = [
    {
      key: "meta",
      value: {
        title: "Peter Iregi Gati — Software Developer",
        description:
          "Portfolio of Peter Iregi Gati, software developer with hands-on experience in Go and JavaScript.",
      },
    },
    {
      key: "socials",
      value: {
        github: "https://github.com/PeterIregi",
        linkedin: "https://www.linkedin.com/in/peter-iregi-gati",
        email: "iregipeter4@gmail.com",
      },
    },
    {
      key: "brand",
      value: {
        name: "Peter Iregi Gati",
        tagline: "Software Developer",
      },
    },
    {
      key: "bio",
      value: {
        photoMediaId: ID.media.bioPhoto,
        summary:
          "Motivated software developer with hands-on experience in Go and JavaScript. Skilled in problem-solving, collaborative learning, and adapting quickly to new technologies.",
      },
    },
  ];

  for (const s of settings) {
    await db.insert(siteSettings).values(s).onConflictDoNothing();
  }
  console.log("Created site settings");

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