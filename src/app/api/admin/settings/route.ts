import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { settingsSchema } from "@/lib/validation/settings";

export async function PUT(req: Request) {
  try {
    await requireAdmin();

    const body = await req.json().catch(() => null);
    const parsed = settingsSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue?.path.join(".") || "settings";
      // Say which field was rejected, not just that the request was bad
      // (design.md §9).
      return NextResponse.json(
        {
          error: `Settings rejected — ${field}: ${issue?.message ?? "invalid value"}`,
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { brand, meta, socials, bio } = parsed.data;

    // Write all editable keys; `bio` is included if provided.
    await db.transaction(async (tx) => {
      for (const [key, value] of Object.entries({ brand, meta, socials, bio })) {
        if (value !== undefined) {
          await tx
            .insert(siteSettings)
            .values({ key, value })
            .onConflictDoUpdate({ target: siteSettings.key, set: { value } });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("update settings error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
