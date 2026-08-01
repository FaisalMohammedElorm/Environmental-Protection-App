import type { Metadata } from "next";
import { StaticPageShell } from "@/components/ui/static-page-shell";
import { Target, Users2, Leaf } from "lucide-react";

export const metadata: Metadata = {
  title: "About — EcoAlert",
  description: "Why EcoAlert exists and how it connects citizens, officers, and administrators."
};

const values = [
  {
    icon: Target,
    title: "Accountability by default",
    body: "Every report has a visible owner and a visible clock. Nothing sits unseen in an inbox."
  },
  {
    icon: Users2,
    title: "Built with the people who use it",
    body: "Citizens, environmental officers, and district administrators shaped every workflow — not just the UI."
  },
  {
    icon: Leaf,
    title: "Cleaner neighborhoods, measured",
    body: "We track resolution time and outcomes, not just report counts, because a filed report isn't a fixed one."
  }
];

export default function AboutPage() {
  return (
    <StaticPageShell
      eyebrow="About EcoAlert"
      title="A shared line of sight between citizens and the people who can act"
      subtitle="EcoAlert started from a simple frustration: environmental hazards get reported informally — a call, a comment, a complaint at a town hall — and then disappear. We built a system where they can't."
    >
      <div className="grid gap-6 sm:grid-cols-3">
        {values.map((v) => (
          <div key={v.title} className="card p-8">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-canopy-700/10 text-canopy-700 dark:text-canopy-200">
              <v.icon className="h-5 w-5" strokeWidth={2} />
            </span>
            <h3 className="mt-5 font-display text-lg font-semibold text-canopy-800 dark:text-canopy-100">{v.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-canopy-500 dark:text-canopy-400">{v.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl font-semibold text-canopy-800 dark:text-canopy-100">How we got here</h2>
          <p className="mt-4 text-sm leading-relaxed text-canopy-600 dark:text-canopy-300">
            EcoAlert began as a pilot with a handful of district environmental offices trying to
            shorten the distance between a citizen noticing a hazard and an officer resolving it.
            The early version was a shared spreadsheet. It worked, barely, until the volume of
            reports outgrew what a spreadsheet could track honestly.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-canopy-600 dark:text-canopy-300">
            What replaced it is this platform: a reporting flow simple enough for anyone with a
            phone, and a review-and-assignment system rigorous enough for a metro sanitation
            department to run its whole caseload through.
          </p>
        </div>
        <div>
          <h2 className="font-display text-2xl font-semibold text-canopy-800 dark:text-canopy-100">Where we're headed</h2>
          <p className="mt-4 text-sm leading-relaxed text-canopy-600 dark:text-canopy-300">
            We're building toward predictive hotspot detection — flagging areas likely to need
            attention before a report even comes in — and tighter integration with municipal work
            order systems, so a resolved report on EcoAlert closes the loop on the ground too.
          </p>
        </div>
      </div>
    </StaticPageShell>
  );
}
