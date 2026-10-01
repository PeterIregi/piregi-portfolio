import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next.js reads .env.local, so the CLI has to read the same file or
// `pnpm db:*` runs against an empty DATABASE_URL.
config({ path: ".env.local" });
config();

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});