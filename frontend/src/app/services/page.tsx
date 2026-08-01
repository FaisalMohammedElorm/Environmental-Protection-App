import type { Metadata } from "next";
import Link from "next/link";
import { StaticPageShell } from "@/components/ui/static-page-shell";
import {
  MapPinned,
  ShieldCheck,
  BarChart3,
  BellRing,
  Users2,
  Building2,
  ArrowUpRight
} from "lucide-react";

export const metadata: Metadata = {
  title: "Services — EcoAlert",
  description: "What EcoAlert offers citizens, environmental officers, and city administrators."
};

const citizenServices = [
  { icon: MapPinned, title: "GPS-tagged reporting", body: "File a hazard in under a minute, with a photo and an exact location." },
  { icon: BellRing, title: "Status tracking & alerts", body: "Follow your report from submission to resolution, with notifications at every step." }
];

const officerServices = [
  { icon: ShieldCheck, title: "Verified report queue", body: "Review, accept, reject, and assign incoming reports with full context and evidence." },
  { icon: BarChart3, title: "Personal performance view", body: "See your resolution rate and average response time alongside the team's." }
];

const adminServices = [
  { icon: Building2, title: "District-wide oversight", body: "Manage users, officers, and categories, and audit every action taken on the platform." },
  { icon: Users2, title: "Analytics & reporting", body: "Heat maps, category trends, and officer performance to guide budget and staffing decisions." }
];

function ServiceGroup({
  heading,
  services
}: {
  heading: string;
  services: Array<{ icon: typeof MapPinned; title: string; body: string }>;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-canopy-800 dark:text-canopy-100">{heading}</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {services.map((s) => (
          <div key={s.title} className="card p-8">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-canopy-700/10 text-canopy-700 dark:text-canopy-200">
              <s.icon className="h-5 w-5" strokeWidth={2} />
            </span>
            <h3 className="mt-5 font-display text-lg font-semibold text-canopy-800 dark:text-canopy-100">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-canopy-500 dark:text-canopy-400">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <StaticPageShell
      eyebrow="Services"
      title="One platform, three different jobs"
      subtitle="EcoAlert is built around the actual workflow of environmental reporting — from the person who spots the problem to the office that closes it out."
    >
      <div className="flex flex-col gap-16">
        <ServiceGroup heading="For citizens" services={citizenServices} />
        <ServiceGroup heading="For environmental officers" services={officerServices} />
        <ServiceGroup heading="For administrators" services={adminServices} />
      </div>

      <div className="mt-16 rounded-3xl bg-canopy-700 p-10 text-center sm:p-14">
        <h2 className="mx-auto max-w-md text-2xl font-semibold text-paper sm:text-3xl">
          Want EcoAlert running in your district?
        </h2>
        <Link
          href="/contact"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-paper dark:bg-canopy-800 px-7 py-3 text-sm font-semibold text-canopy-800 dark:text-canopy-100"
        >
          Talk to us
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </StaticPageShell>
  );
}
