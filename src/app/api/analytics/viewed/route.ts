import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pageViews } from "@/lib/db/schema";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const path = body?.path;

    if (!path || typeof path !== "string") {
      return NextResponse.json({ error: "Path required" }, { status: 400 });
    }

    // Basic bot filtering - ignore requests with no user agent or suspicious patterns
    const userAgent = req.headers.get("user-agent") || "";
    if (!userAgent || userAgent.includes("bot") || userAgent.includes("crawler")) {
      return NextResponse.json({ success: true });
    }

    await db.insert(pageViews).values({ path });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("page view error:", error);
    return NextResponse.json({ error: "Failed to record view" }, { status: 500 });
  }
}