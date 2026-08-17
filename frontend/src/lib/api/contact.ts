import { sendContactMessageAction } from "@/app/actions/contact";
import type { ContactFormValues } from "@/lib/validators/contact";

export async function sendContactMessage(payload: ContactFormValues): Promise<{ message: string }> {
  return sendContactMessageAction(payload);
}
