import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Raised by requireAdmin() when there is no valid session. Route handlers
 * check isUnauthorized() in their catch blocks and answer 401 instead of
 * the generic 500 (#96); the admin pages are gated by /src/proxy.ts and
 * normally never reach a throw here.
 */
export class UnauthorizedError extends Error {
  constructor() {
    super("UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    throw new UnauthorizedError();
  }
  return session.user;
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof UnauthorizedError;
}

/** 401 payload for admin API routes when requireAdmin() rejects a request. */
export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}