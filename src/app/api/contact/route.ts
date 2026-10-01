import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contactSubmissions } from "@/lib/db/schema";
import { sendContactNotification } from "@/lib/email";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(5000),
  hp: z.string().optional(), // honeypot
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const raw = {
      name: formData.get("name"),
      email: formData.get("email"),
      message: formData.get("message"),
      hp: formData.get("hp"),
    };

    const parsed = contactSchema.safeParse(raw);

    // Honeypot check
    if (raw.hp) {
      return NextResponse.json({ success: true }); // Silently succeed
    }

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
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
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}