import { testimonials } from "@/lib/mock-data";
import { Quote } from "lucide-react";

export function Testimonials() {
  return (
    <section id="testimonials" className="container-app py-24">
      <div className="mb-14 max-w-xl">
        <span className="eyebrow mb-3 block">From the field</span>
        <h2 className="text-3xl font-semibold text-canopy-800 dark:text-canopy-100 sm:text-4xl">
          People using it daily
        </h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {testimonials.map((t) => (
          <figure key={t.name} className="card flex flex-col p-8">
            <Quote className="h-6 w-6 text-moss" strokeWidth={2} />
            <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-canopy-600 dark:text-canopy-300">
              {t.quote}
            </blockquote>
            <figcaption className="mt-6 border-t border-canopy-100 dark:border-canopy-700 pt-4">
              <p className="font-display text-sm font-semibold text-canopy-800 dark:text-canopy-100">{t.name}</p>
              <p className="text-xs text-canopy-400 dark:text-canopy-500">{t.role}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
