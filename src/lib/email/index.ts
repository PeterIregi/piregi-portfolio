export async function sendPasswordReset(email: string, resetUrl: string) {
  const subject = "Reset your password";
  const html = `
    <p>You requested a password reset.</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p>This link expires in 1 hour.</p>
  `;

  if (!process.env.RESEND_API_KEY) {
    console.log(`[dev] Password reset email to ${email}: ${resetUrl}`);
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: "Piregi Portfolio <no-reply@piregi.dev>",
    to: email,
    subject,
    html,
  });
}

export async function sendContactNotification(submission: { name: string; email: string; message: string }) {
  const subject = `New contact from ${submission.name}`;
  const html = `
    <p><strong>Name:</strong> ${submission.name}</p>
    <p><strong>Email:</strong> ${submission.email}</p>
    <p><strong>Message:</strong></p>
    <p>${submission.message.replace(/\n/g, "<br>")}</p>
  `;

  if (!process.env.RESEND_API_KEY) {
    console.log(`[dev] Contact notification: ${subject}`);
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: "Piregi Portfolio <no-reply@piregi.dev>",
    to: process.env.CONTACT_NOTIFY_EMAIL ?? "",
    subject,
    html,
  });
}