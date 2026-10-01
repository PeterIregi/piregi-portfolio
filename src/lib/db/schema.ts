import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  role: text("role").notNull().default("admin"), // single role in v1, PRD §11
  lastLogin: timestamp("last_login", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }), // null = still valid
});

export const mediaAssets = pgTable("media_assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  storagePath: text("storage_path").notNull(),
  publicUrl: text("public_url").notNull(),
  altText: text("alt_text"), // required before publish use, PRD §7 a11y
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  summary: text("summary").notNull(),
  description: text("description").notNull(),
  coverMediaId: uuid("cover_media_id").references(() => mediaAssets.id),
  techStack: text("tech_stack")
    .array()
    .notNull()
    .default([]),
  tags: text("tags")
    .array()
    .notNull()
    .default([]),
  projectUrl: text("project_url"),
  repoUrl: text("repo_url"),
  status: text("status").notNull().default("draft"), // 'draft' | 'published'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const projectGallery = pgTable("project_gallery", {
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  mediaId: uuid("media_id")
    .notNull()
    .references(() => mediaAssets.id, { onDelete: "cascade" }),
  position: integer("position").notNull().default(0),
});

export const experiences = pgTable("experiences", {
  id: uuid("id").defaultRandom().primaryKey(),
  roleTitle: text("role_title").notNull(),
  organization: text("organization").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"), // null = ongoing
  description: text("description").notNull(),
  type: text("type").notNull(), // 'work' | 'education' | 'certification'
  sortOrder: integer("sort_order").notNull().default(0),
});

export const skills = pgTable("skills", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  proficiency: integer("proficiency"), // 1-5, nullable per PRD §4.1 "optional"
});

export const testimonials = pgTable("testimonials", {
  id: uuid("id").defaultRandom().primaryKey(),
  authorName: text("author_name").notNull(),
  authorTitle: text("author_title").notNull(),
  company: text("company"),
  quote: text("quote").notNull(),
  avatarMediaId: uuid("avatar_media_id").references(() => mediaAssets.id),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const cvFiles = pgTable(
  "cv_files",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storagePath: text("storage_path").notNull(), // key in the private CV bucket
    originalFilename: text("original_filename").notNull(),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
    isActive: boolean("is_active").notNull().default(false),
    downloadCount: integer("download_count").notNull().default(0),
  },
  (t) => [
    // At most one active CV ever exists; this is the DB-level half of §7
    uniqueIndex("cv_files_one_active").on(t.isActive).where(sql`${t.isActive} = true`),
  ],
);

export const contactSubmissions = pgTable("contact_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
  status: text("status").notNull().default("new"), // 'new' | 'read' | 'archived'
});

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(), // e.g. 'meta', 'socials', 'brand'
  value: jsonb("value").notNull(),
});

export const pageViews = pgTable(
  "page_views",
  {
    id: bigint("id", { mode: "bigint" }).primaryKey().generatedAlwaysAsIdentity(),
    path: text("path").notNull(), // path only, no cookies/IPs, PRD §4.3
    viewedAt: timestamp("viewed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("page_views_path_time").on(t.path, t.viewedAt)],
);

export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Experience = typeof experiences.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type Testimonial = typeof testimonials.$inferSelect;
export type CvFile = typeof cvFiles.$inferSelect;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type MediaAsset = typeof mediaAssets.$inferSelect;
export type SiteSetting = typeof siteSettings.$inferSelect;
export type PageView = typeof pageViews.$inferSelect;
