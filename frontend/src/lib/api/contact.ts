import { apiClient } from "@/lib/api/client";
import type { ContactFormValues } from "@/lib/validators/contact";

export async function sendContactMessage(payload: ContactFormValues): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>("/contact", payload);
  return data;
}
