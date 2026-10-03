import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle> | null = null;
let _sql: ReturnType<typeof postgres> | null = null;

function getDb() {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL ?? "";
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    const client = postgres(connectionString, { prepare: false });
    _sql = client;
    _db = drizzle(client, { schema });
  }
  return _db;
}

/**
 * Scripts (seed, checks) need to drop the pool, otherwise the postgres
 * client holds the event loop open and the script never exits. Server code
 * has no reason to call it.
 */
export async function closeDb() {
  await _sql?.end({ timeout: 3 });
  _sql = null;
  _db = null;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});

export { schema };