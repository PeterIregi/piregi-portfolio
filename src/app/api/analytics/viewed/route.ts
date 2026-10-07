import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pageViews } from "@/lib/db/schema";
import { pageViewSchema } from "@/lib/validation/analytics";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = pageViewSchema.safeParse(body);

    if (!parsed.success) {
      // Public surface: safe generic message, specifics logged server-side
      // (design.md §5/§9). The beacon's own path always passes validation,
      // so a 400 marks a hand-rolled or malformed request, not the client.
      console.warn("rejected page view:", body);
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const path = parsed.data.path;

    // Basic bot filtering - ignore requests with no user agent or
    // suspicious patterns before anything is written.
    const userAgent = req.headers.get("user-agent") || "";
    if (!userAgent || /(bot|crawler|spider)/i.test(userAgent)) {
      return NextResponse.json({ success: true });
    }

    await db.insert(pageViews).values({ path });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("page view error:", error);
    return NextResponse.json({ error: "Failed to record view" }, { status: 500 });
  }
}