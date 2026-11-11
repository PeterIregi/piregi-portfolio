import net from "node:net";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Supabase's pooler hostname returns IPv4 addresses plus DNS64-synthesised
 * `64:ff9b::/96` addresses that have no route on IPv4-only networks. Node 22's
 * address-family autoselection tries those unreachable AAAA records and lets
 * each attempt time out instead of settling on the working IPv4 address, so
 * roughly a third of connections fail with ETIMEDOUT even though every IPv4
 * address accepts TCP in ~300ms (#137).
 *
 * Disabling autoselection makes Node use the first DNS result (IPv4 here).
 * It is a process-wide switch, which is why it lives beside the one client
 * that opens outbound TCP to Supabase rather than in a dev-only script.
 */
net.setDefaultAutoSelectFamily(false);

let _db: ReturnType<typeof drizzle> | null = null;
let _sql: ReturnType<typeof postgres> | null = null;

function getDb() {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL ?? "";
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    // Supabase's pooler does not issue a certificate chain that Node's
    // default trust store accepts, so `require` encrypts the connection
    // without verification. It is still strictly better than the plaintext
    // connection postgres.js opens when `ssl` is unset.
    const client = postgres(connectionString, { prepare: false, ssl: "require" });
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