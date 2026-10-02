import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contactSubmissions } from "@/lib/db/schema";
import { sendContactNotification } from "@/lib/email";
import { contactSubmissionSchema } from "@/lib/validation/messages";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const raw = {
      name: formData.get("name"),
      email: formData.get("email"),
      message: formData.get("message"),
      hp: formData.get("hp"),
    };

    // Honeypot: real visitors' form never populates hp (it is hidden).
    // Treat a filled-in field as a bot and silently "succeed" (design.md §5).
    const hpValue = typeof raw.hp === "string" ? raw.hp.trim() : "";
    if (hpValue) {
      return NextResponse.json({ success: true });
    }

    const parsed = contactSubmissionSchema.safeParse(raw);

    if (!parsed.success) {
      // Public form: safe generic message, specifics logged server-side
      // (design.md §9).
      console.warn("contact submission rejected:", parsed.error.flatten());
      return NextResponse.json({ error: "Please check your details and try again" }, { status: 400 });
    }

    const { name, email, message } = parsed.data;

    // Store in database
    await db.insert(contactSubmissions).values({ name, email, message });

    // Send notification email (async, don't block response)
    sendContactNotification({ name, email, message }).catch((err) => {
      console.error("contact notification failed:", err);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("contact submission error:", error);
    return NextResponse.json({ error: "Something went wrong, please try again later" }, { status: 500 });
  }
}