import { features } from "@/lib/mock-data";
import {
  MapPinned,
  Camera,
  Radar,
  LayoutDashboard,
  Flame,
  BellRing,
  type LucideIcon
} from "lucide-react";

const icons: LucideIcon[] = [MapPinned, Camera, Radar, LayoutDashboard, Flame, BellRing];

export function Features() {
  return (
    <section id="features" className="bg-mist dark:bg-canopy-800 py-24">
      <div className="container-app">
        <div className="mb-14 max-w-xl">
          <span className="eyebrow mb-3 block">Built for accountability</span>
          <h2 className="text-3xl font-semibold text-canopy-800 dark:text-canopy-100 sm:text-4xl">
            Everything a report needs to hold up
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => {
            const Icon = icons[i % icons.length] ?? MapPinned;
            return (
              <div key={feature.title} className="card p-8">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-canopy-700/10 text-canopy-700 dark:text-canopy-200">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-canopy-800 dark:text-canopy-100">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-canopy-500 dark:text-canopy-400">{feature.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
