import { howItWorks } from "@/lib/mock-data";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="container-app py-24">
      <div className="mb-14 max-w-xl">
        <span className="eyebrow mb-3 block">The field log</span>
        <h2 className="text-3xl font-semibold text-canopy-800 dark:text-canopy-100 sm:text-4xl">
          Four steps from sighting to fix
        </h2>
        <p className="mt-4 text-canopy-500 dark:text-canopy-400">
          Every report follows the same accountable path — nothing sits in an inbox unseen.
        </p>
      </div>

      <ol className="grid gap-px overflow-hidden rounded-2xl bg-canopy-100 dark:bg-canopy-700 sm:grid-cols-2 lg:grid-cols-4">
        {howItWorks.map((item) => (
          <li key={item.step} className="flex flex-col bg-paper dark:bg-canopy-800 p-8">
            <span className="font-mono text-sm text-moss-dark">{item.step}</span>
            <h3 className="mt-4 font-display text-lg font-semibold text-canopy-800 dark:text-canopy-100">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-canopy-500 dark:text-canopy-400">{item.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
