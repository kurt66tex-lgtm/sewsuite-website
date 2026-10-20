"use server";

// Legacy Resend form delivery has been retired. Independent Sew Suite requests
// must pass Cloudflare verification and receive a committed production CRM lead
// identifier before the frontend may display a success acknowledgment.
interface FormState {
  success: boolean;
  error: boolean;
  message: string;
}

export async function submitContactForm(
  _prevState: FormState,
  _formData: FormData
): Promise<FormState> {
  return {
    success: false,
    error: true,
    message: "This legacy form is disabled. Use the independent verified quote request form.",
  };
}
