import { NextResponse } from "next/server";
import { requireAdmin, isUnauthorized, unauthorizedResponse } from "@/lib/auth/guards";
import { activateCv, getCvById } from "@/lib/db/cv";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    const existing = await getCvById(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await activateCv(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("activate CV error:", error);
    if (isUnauthorized(error)) return unauthorizedResponse();
    return NextResponse.json({ error: "Failed to activate CV" }, { status: 500 });
  }
}