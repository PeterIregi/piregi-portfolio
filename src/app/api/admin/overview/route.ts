import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { contactSubmissions, cvFiles, pageViews } from "@/lib/db/schema";
import { count, desc, sql } from "drizzle-orm";

export async function GET() {
  try {
    await requireAdmin();

    const [recentMessages, cvStats, visitStats] = await Promise.all([
      db
        .select()
        .from(contactSubmissions)
        .orderBy(desc(contactSubmissions.submittedAt))
        .limit(5),
      db
        .select({ total: sql<number>`sum(${cvFiles.downloadCount})` })
        .from(cvFiles),
      db
        .select({ count: count() })
        .from(pageViews)
        .where(sql`${pageViews.viewedAt} > NOW() - INTERVAL '30 days'`),
    ]);

    return NextResponse.json({
      recentMessages: recentMessages.map(m => ({
        id: m.id,
        name: m.name,
        email: m.email,
        submittedAt: m.submittedAt.toISOString(),
        status: m.status,
      })),
      totalCvDownloads: cvStats[0]?.total ?? 0,
      visitsLast30Days: visitStats[0]?.count ?? 0,
    });
  } catch (error) {
    console.error("admin overview error:", error);
    return NextResponse.json({ error: "Failed to fetch overview" }, { status: 500 });
  }
}