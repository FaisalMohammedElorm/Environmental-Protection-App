import type { Metadata } from "next";
import { StaticPageShell } from "@/components/ui/static-page-shell";

export const metadata: Metadata = {
  title: "Terms of Service — EcoAlert",
  description: "The terms governing your use of EcoAlert."
};

const sections = [
  {
    heading: "1. Acceptance of terms",
    body: [
      "By creating an account or using EcoAlert, you agree to these Terms of Service and our Privacy Policy. If you don't agree, please don't use the platform."
    ]
  },
  {
    heading: "2. Who can use EcoAlert",
    body: [
      "You must be able to form a binding contract in your jurisdiction to create an account. Officer and administrator accounts are provisioned by an authorized district administrator."
    ]
  },
  {
    heading: "3. Acceptable use",
    body: [
      "Report content must be accurate to the best of your knowledge. Do not submit false reports, harassing content, or images unrelated to an environmental hazard.",
      "Do not attempt to access accounts, data, or areas of the platform you're not authorized to access, or interfere with the platform's normal operation."
    ]
  },
  {
    heading: "4. Report content and ownership",
    body: [
      "You retain ownership of photos and descriptions you submit, and grant EcoAlert a license to use, display, and share that content as needed to operate the reporting and review workflow, including with the relevant environmental officers and administrators.",
      "We may remove report content that violates these terms or applicable law."
    ]
  },
  {
    heading: "5. Officer and administrator responsibilities",
    body: [
      "Officers and administrators are expected to review and act on reports in good faith and in accordance with their district's policies. Misuse of elevated access — including viewing or altering reports outside the scope of your duties — may result in account suspension."
    ]
  },
  {
    heading: "6. Service availability",
    body: [
      "We aim for high availability but do not guarantee uninterrupted access. Scheduled maintenance and unforeseen outages may occur; critical or emergency hazards should also be reported through your local emergency services."
    ]
  },
  {
    heading: "7. Limitation of liability",
    body: [
      "EcoAlert is a reporting and coordination tool. We are not responsible for the outcome of any specific report, including response time or resolution, which depends on the relevant district's operations and resources."
    ]
  },
  {
    heading: "8. Changes to these terms",
    body: [
      "We may update these terms from time to time. Material changes will be communicated via email or an in-app notice before they take effect."
    ]
  },
  {
    heading: "9. Contact",
    body: ["Questions about these terms can be sent to legal@ecoalert.app."]
  }
];

export default function TermsOfServicePage() {
  return (
    <StaticPageShell eyebrow="Legal" title="Terms of Service" subtitle="Last updated July 2026.">
      <div className="mx-auto max-w-2xl space-y-10">
        {sections.map((s) => (
          <div key={s.heading}>
            <h2 className="font-display text-xl font-semibold text-canopy-800 dark:text-canopy-100">{s.heading}</h2>
            <div className="mt-3 space-y-2">
              {s.body.map((p, i) => (
                <p key={i} className="text-sm leading-relaxed text-canopy-600 dark:text-canopy-300">
                  {p}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </StaticPageShell>
  );
}
