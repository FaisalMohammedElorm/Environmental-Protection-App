import type { Metadata } from "next";
import { StaticPageShell } from "@/components/ui/static-page-shell";

export const metadata: Metadata = {
  title: "Privacy Policy — EcoAlert",
  description: "How EcoAlert collects, uses, and protects your data."
};

const sections = [
  {
    heading: "1. Information we collect",
    body: [
      "Account information: your name, email address, phone number (if provided), and password (stored as a salted hash, never in plain text).",
      "Report content: category, description, severity, photos, and the GPS coordinates you provide or capture through your device when filing a report.",
      "Usage data: log data such as IP address, browser type, and pages visited, used for security and service reliability."
    ]
  },
  {
    heading: "2. How we use your information",
    body: [
      "To operate the reporting workflow — routing your reports to environmental officers, notifying you of status changes, and letting officers and administrators review report history.",
      "To improve the service, including aggregate, de-identified analytics on report volume, category trends, and response times.",
      "To communicate with you about your account, including security notices and, where you've opted in, product updates."
    ]
  },
  {
    heading: "3. Who can see your reports",
    body: [
      "Environmental officers and administrators in your district can see the full content of reports you file, including your name, so they can follow up if needed.",
      "Other citizens cannot see your name attached to a report. Aggregate, de-identified report data may be shown publicly (e.g. a live map of report locations and categories)."
    ]
  },
  {
    heading: "4. Data retention",
    body: [
      "We retain report data for as long as your account is active and for a reasonable period afterward for record-keeping and audit purposes, consistent with applicable local regulations.",
      "You can request deletion of your account and associated personal data by contacting us; some report data may be retained in de-identified form for historical analytics."
    ]
  },
  {
    heading: "5. Security",
    body: [
      "We use industry-standard practices including password hashing, encrypted connections (HTTPS), rate limiting, and role-based access control to protect your data.",
      "No system is perfectly secure. If we become aware of a data breach affecting your information, we will notify you as required by applicable law."
    ]
  },
  {
    heading: "6. Your rights",
    body: [
      "You can access, correct, or request deletion of your personal information at any time from your account settings or by contacting us directly.",
      "You can opt out of non-essential email communications while continuing to receive service-related notifications about your reports."
    ]
  },
  {
    heading: "7. Contact",
    body: ["Questions about this policy can be sent to privacy@ecoalert.app."]
  }
];

export default function PrivacyPolicyPage() {
  return (
    <StaticPageShell eyebrow="Legal" title="Privacy Policy" subtitle="Last updated July 2026.">
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
