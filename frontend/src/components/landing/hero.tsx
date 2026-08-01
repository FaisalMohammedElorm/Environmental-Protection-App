"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";

const pins = [
  { top: "22%", left: "28%", severity: "high", label: "Illegal dumping" },
  { top: "48%", left: "62%", severity: "moderate", label: "Blocked drain" },
  { top: "68%", left: "38%", severity: "critical", label: "Bush fire" },
  { top: "34%", left: "74%", severity: "low", label: "Overflowing bin" }
];

const severityColor: Record<string, string> = {
  low: "bg-moss",
  moderate: "bg-alert-amber",
  high: "bg-alert-amber",
  critical: "bg-alert-clay"
};

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-mist dark:bg-canopy-800">
      <div className="absolute inset-0 bg-contour bg-cover opacity-70" aria-hidden />

      <div className="container-app relative grid gap-12 py-20 lg:grid-cols-2 lg:gap-8 lg:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col justify-center"
        >
          <span className="eyebrow mb-5">Environmental reporting, field-verified</span>
          <h1 className="text-4xl font-semibold leading-[1.05] text-canopy-800 dark:text-canopy-100 sm:text-5xl lg:text-6xl">
            See a hazard.
            <br />
            Drop a pin.
            <br />
            <span className="text-moss-dark">Watch it get fixed.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-canopy-500 dark:text-canopy-400">
            EcoAlert turns a phone photo and a GPS pin into a tracked case — routed to the right
            environmental officer, resolved, and closed with proof.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/register" className="btn-primary">
              Report an issue
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link href="/how-it-works" className="btn-secondary">
              See how it works
            </Link>
          </div>

          <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-canopy-100 dark:border-canopy-700 pt-6">
            <div>
              <dt className="eyebrow mb-1">Reports</dt>
              <dd className="font-mono text-xl font-medium text-canopy-800 dark:text-canopy-100">18,204</dd>
            </div>
            <div>
              <dt className="eyebrow mb-1">Resolved</dt>
              <dd className="font-mono text-xl font-medium text-canopy-800 dark:text-canopy-100">92%</dd>
            </div>
            <div>
              <dt className="eyebrow mb-1">Avg. response</dt>
              <dd className="font-mono text-xl font-medium text-canopy-800 dark:text-canopy-100">6.4h</dd>
            </div>
          </dl>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
          className="relative flex min-h-[380px] items-center justify-center"
        >
          <div className="relative aspect-square w-full max-w-md rounded-[2rem] border border-canopy-100 dark:border-canopy-700 bg-paper/70 dark:bg-canopy-800/70 shadow-[0_20px_60px_-15px_rgba(15,42,29,0.25)] backdrop-blur-sm">
            <div className="absolute inset-0 overflow-hidden rounded-[2rem]">
              <div className="absolute inset-0 bg-contour bg-cover opacity-100" aria-hidden />
            </div>

            {pins.map((pin, i) => (
              <div
                key={i}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ top: pin.top, left: pin.left }}
              >
                <span className="relative flex h-3 w-3">
                  <span
                    className={`absolute inline-flex h-full w-full animate-ping-slow rounded-full ${severityColor[pin.severity]} opacity-75`}
                  />
                  <span
                    className={`relative inline-flex h-3 w-3 items-center justify-center rounded-full ${severityColor[pin.severity]}`}
                  >
                    <MapPin className="h-2 w-2 text-paper" strokeWidth={3} />
                  </span>
                </span>
              </div>
            ))}

            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl border border-canopy-100 dark:border-canopy-700 bg-paper dark:bg-canopy-800 px-4 py-3 shadow-sm">
              <div>
                <p className="eyebrow">Live now</p>
                <p className="font-display text-sm font-medium text-canopy-800 dark:text-canopy-100">4 active reports nearby</p>
              </div>
              <span className="h-2 w-2 rounded-full bg-moss" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
