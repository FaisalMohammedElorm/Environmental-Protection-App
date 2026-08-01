const partners = [
  "Ministry of Sanitation",
  "Metro Assemblies Council",
  "Greenline Waste Co.",
  "Blue Water Initiative",
  "Forestry Commission"
];

export function Partners() {
  return (
    <section className="border-y border-canopy-100 dark:border-canopy-700 bg-mist/60 dark:bg-canopy-800/60 py-12">
      <div className="container-app">
        <p className="eyebrow mb-6 text-center">Working alongside</p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {partners.map((p) => (
            <span key={p} className="font-display text-sm font-medium text-canopy-400 dark:text-canopy-500">
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
