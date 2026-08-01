import type { Metadata } from "next";
import { Mail, Phone, MapPin } from "lucide-react";
import { StaticPageShell } from "@/components/ui/static-page-shell";
import { ContactForm } from "@/components/forms/contact-form";

export const metadata: Metadata = {
  title: "Contact — EcoAlert",
  description: "Get in touch with the EcoAlert team."
};

const details = [
  { icon: Mail, label: "Email", value: "hello@ecoalert.app" },
  { icon: Phone, label: "Phone", value: "+233 30 000 0000" },
  { icon: MapPin, label: "Office", value: "Accra, Ghana" }
];

export default function ContactPage() {
  return (
    <StaticPageShell
      eyebrow="Contact"
      title="Questions, partnerships, or a district to onboard?"
      subtitle="Reach out and we'll get back to you within one business day."
    >
      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6">
          {details.map((d) => (
            <div key={d.label} className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-canopy-700/10 text-canopy-700 dark:text-canopy-200">
                <d.icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <div>
                <p className="eyebrow mb-0.5">{d.label}</p>
                <p className="text-sm font-medium text-canopy-800 dark:text-canopy-100">{d.value}</p>
              </div>
            </div>
          ))}
        </div>

        <ContactForm />
      </div>
    </StaticPageShell>
  );
}
