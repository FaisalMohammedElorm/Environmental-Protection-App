import type { Metadata } from "next";
import { StaticPageShell } from "@/components/ui/static-page-shell";
import { howItWorks } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "How It Works — EcoAlert",
  description: "The full path a report takes on EcoAlert, from sighting to resolution."
};

const roleNotes = [
  {
    role: "Citizen",
    body: "You file the report with a photo, a pinned location, and a short description. You'll get a notification the moment its status changes — no need to check back manually."
  },
  {
    role: "Environmental officer",
    body: "New reports land in your queue. You can accept, reject, or assign them, leave comments for the citizen or your team, and update status as work progresses."
  },
  {
    role: "Administrator",
    body: "You see the whole picture — every report, every officer's workload, category trends, and a full audit trail of who changed what and when."
  }
];

export default function HowItWorksPage() {
  return (
    <StaticPageShell
      eyebrow="How it works"
      title="From a phone photo to a closed case"
      subtitle="Every report moves through the same four stages, visible to everyone involved."
    >
      <ol className="grid gap-px overflow-hidden rounded-2xl bg-canopy-100 dark:bg-canopy-700 sm:grid-cols-2 lg:grid-cols-4">
        {howItWorks.map((item) => (
          <li key={item.step} className="flex flex-col bg-paper dark:bg-canopy-800 p-8">
            <span className="font-mono text-sm text-moss-dark">{item.step}</span>
            <h3 className="mt-4 font-display text-lg font-semibold text-canopy-800 dark:text-canopy-100">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-canopy-500 dark:text-canopy-400">{item.body}</p>
          </li>
        ))}
      </ol>

      <div className="mt-16">
        <h2 className="mb-6 font-display text-2xl font-semibold text-canopy-800 dark:text-canopy-100">What each role sees</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {roleNotes.map((r) => (
            <div key={r.role} className="card p-8">
              <span className="eyebrow mb-2 block">{r.role}</span>
              <p className="text-sm leading-relaxed text-canopy-600 dark:text-canopy-300">{r.body}</p>
            </div>
          ))}
        </div>
      </div>
    </StaticPageShell>
  );
}
