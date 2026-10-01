import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

// Single client per process. Next.js dev reloads modules, so the connection
// is cached on globalThis or every hot reload leaks a new pool until Supabase
// refuses connections.
const globalForDb = globalThis as unknown as {
  client?: postgres.Sql;
  db?: ReturnType<typeof drizzle<typeof schema>>;
};

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.",
    );
  }
  return postgres(url, {
    max: process.env.NODE_ENV === "production" ? 10 : 1,
    prepare: false,
  });
}

const client = globalForDb.client ?? createClient();
const db = globalForDb.db ?? drizzle(client, { schema });

if (process.env.NODE_ENV !== "production") {
  globalForDb.client = client;
  globalForDb.db = db;
}

export { db };
export { client };
