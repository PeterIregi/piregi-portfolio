import "dotenv/config";
import { db } from "@/lib/db";
import {
  users,
  projects,
  experiences,
  skills,
  testimonials,
  cvFiles,
  siteSettings,
  mediaAssets,
  projectGallery,
  contactSubmissions,
} from "@/lib/db/schema";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  // Admin user
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
  const userId = user?.id ?? (await db.select({ id: users.id }).from(users).where(eq(users.email, "admin@piregi.dev")).limit(1))[0].id;

  console.log("Created admin user:", userId);

  // Media assets (placeholder images)
  const media = [
    { id: "proj1-cover", storagePath: "projects/proj1-cover.jpg", publicUrl: "/placeholder-project1.jpg", altText: "Project 1 cover", mimeType: "image/jpeg", sizeBytes: 102400 },
    { id: "proj2-cover", storagePath: "projects/proj2-cover.jpg", publicUrl: "/placeholder-project2.jpg", altText: "Project 2 cover", mimeType: "image/jpeg", sizeBytes: 102400 },
    { id: "testimonial1-avatar", storagePath: "testimonials/avatar1.jpg", publicUrl: "/placeholder-avatar1.jpg", altText: "Avatar for testimonial 1", mimeType: "image/jpeg", sizeBytes: 51200 },
  ];

  for (const m of media) {
    await db.insert(mediaAssets).values(m).onConflictDoNothing();
  }
  console.log("Created media assets");

  // Projects
  const projectsData = [
    {
      id: "proj1",
      title: "E-commerce Platform",
      slug: "ecommerce-platform",
      summary: "Full-stack e-commerce solution with real-time inventory.",
      description: "Built a scalable e-commerce platform with Next.js, PostgreSQL, and Stripe integration. Features include real-time inventory management, order tracking, and admin dashboard.",
      coverMediaId: "proj1-cover",
      techStack: ["Next.js", "PostgreSQL", "Stripe", "Tailwind"],
      tags: ["full-stack", "e-commerce"],
      projectUrl: "https://example.com",
      repoUrl: "https://github.com/example",
      status: "published" as const,
    },
    {
      id: "proj2",
      title: "Task Management App",
      slug: "task-management-app",
      summary: "Collaborative task manager with real-time updates.",
      description: "A modern task management application with drag-and-drop boards, team workspaces, and WebSocket-based real-time collaboration.",
      coverMediaId: "proj2-cover",
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

  // Project gallery
  await db
    .insert(projectGallery)
    .values([
      { projectId: "proj1", mediaId: "proj1-cover", position: 0 },
      { projectId: "proj2", mediaId: "proj2-cover", position: 0 },
    ])
    .onConflictDoNothing();
  console.log("Created project gallery");

  // Experiences
  const experiencesData = [
    {
      id: "exp1",
      roleTitle: "Senior Full Stack Developer",
      organization: "TechCorp Inc.",
      startDate: "2022-01-15",
      endDate: null,
      description: "Lead development of core platform features, mentor junior developers, architect scalable solutions.",
      type: "work" as const,
      sortOrder: 0,
    },
    {
      id: "exp2",
      roleTitle: "Full Stack Developer",
      organization: "StartupXYZ",
      startDate: "2019-06-01",
      endDate: "2022-01-10",
      description: "Built and maintained multiple client projects, implemented CI/CD pipelines.",
      type: "work" as const,
      sortOrder: 1,
    },
    {
      id: "exp3",
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

  // Skills
  const skillsData = [
    { id: "skill1", name: "TypeScript", category: "Languages", proficiency: 5 },
    { id: "skill2", name: "React", category: "Frontend", proficiency: 5 },
    { id: "skill3", name: "Node.js", category: "Backend", proficiency: 5 },
    { id: "skill4", name: "PostgreSQL", category: "Databases", proficiency: 4 },
    { id: "skill5", name: "AWS", category: "Cloud", proficiency: 3 },
    { id: "skill6", name: "Docker", category: "DevOps", proficiency: 4 },
  ];

  for (const s of skillsData) {
    await db.insert(skills).values(s).onConflictDoNothing();
  }
  console.log("Created skills");

  // Testimonials
  const testimonialsData = [
    {
      id: "test1",
      authorName: "Jane Smith",
      authorTitle: "CTO",
      company: "TechCorp Inc.",
      quote: "Peter delivers high-quality code and thinks deeply about architecture. A true asset to any team.",
      avatarMediaId: "testimonial1-avatar",
      sortOrder: 0,
    },
  ];

  for (const t of testimonialsData) {
    await db.insert(testimonials).values(t).onConflictDoNothing();
  }
  console.log("Created testimonials");

  // Site settings
  const settings = [
    {
      key: "meta",
      value: {
        title: "Peter Iregi — Full Stack Developer",
        description: "Portfolio of Peter Iregi, full stack developer specializing in React, Node.js, and cloud architecture.",
        ogImage: "/og-image.jpg",
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
  ];

  for (const s of settings) {
    await db.insert(siteSettings).values(s).onConflictDoNothing();
  }
  console.log("Created site settings");

  // Sample contact submission
  await db
    .insert(contactSubmissions)
    .values({
      id: "contact1",
      name: "Jane Doe",
      email: "jane@example.com",
      message: "I'd love to discuss a potential project with you.",
      status: "new",
    })
    .onConflictDoNothing();
  console.log("Created sample contact submission");

  console.log("Seeding complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});