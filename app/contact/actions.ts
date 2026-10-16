"use server";

// Prelaunch comparison build: outbound contact requests are deliberately disabled.
// The replacement Railway-backed intake adapter must be implemented and validated
// before this form may submit. No Resend calls or production customer records.
interface FormState { success: boolean; error: boolean; message: string; }
export async function submitContactForm(_prevState: FormState, _formData: FormData): Promise<FormState> {
  return {success:false,error:true,message:"This comparison website is not accepting requests yet. Please use www.sewsuite.com."};
}
