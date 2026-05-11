"use server";

import { Resend } from "resend";

interface FormState {
  success: boolean;
  error: boolean;
  message: string;
}

export async function submitContactForm(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const name = formData.get("name")?.toString().trim() ?? "";
  const business = formData.get("business")?.toString().trim() ?? "";
  const email = formData.get("email")?.toString().trim() ?? "";
  const phone = formData.get("phone")?.toString().trim() ?? "";
  const message = formData.get("message")?.toString().trim() ?? "";

  if (!name || !email || !message) {
    return { success: false, error: true, message: "Required fields missing." };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "reports@servicetradeagency.com",
      to: "kurt66tex@gmail.com",
      subject: `New Sew Suite inquiry from ${name}`,
      text: `
Name: ${name}
Business: ${business || "N/A"}
Email: ${email}
Phone: ${phone || "N/A"}

Message:
${message}
      `.trim(),
      html: `
<h2>New Sew Suite Inquiry</h2>
<table cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
  <tr><td><strong>Name</strong></td><td>${name}</td></tr>
  <tr><td><strong>Business</strong></td><td>${business || "N/A"}</td></tr>
  <tr><td><strong>Email</strong></td><td>${email}</td></tr>
  <tr><td><strong>Phone</strong></td><td>${phone || "N/A"}</td></tr>
</table>
<h3>Message</h3>
<p style="font-family:sans-serif;font-size:14px;white-space:pre-wrap;">${message}</p>
      `.trim(),
    });

    return { success: true, error: false, message: "Sent." };
  } catch {
    return { success: false, error: true, message: "Email send failed." };
  }
}
