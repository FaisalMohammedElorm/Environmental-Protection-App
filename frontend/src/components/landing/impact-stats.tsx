import { impactStats } from "@/lib/mock-data";

export function ImpactStats() {
  return (
    <section className="border-y border-canopy-100 dark:border-canopy-700 bg-canopy-700">
      <div className="container-app grid grid-cols-2 gap-8 py-12 sm:grid-cols-4">
        {impactStats.map((stat) => (
          <div key={stat.label} className="text-center sm:text-left">
            <p className="font-display text-3xl font-semibold text-paper sm:text-4xl">{stat.value}</p>
            <p className="mt-1 text-sm text-canopy-200 dark:text-white-700">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
