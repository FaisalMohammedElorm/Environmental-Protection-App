import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function Cta() {
  return (
    <section className="container-app pb-24">
      <div className="relative overflow-hidden rounded-3xl bg-canopy-700 px-8 py-16 text-center sm:px-16">
        <div className="absolute inset-0 bg-contour bg-cover opacity-20 invert" aria-hidden />
        <div className="relative">
          <h2 className="mx-auto max-w-lg text-3xl font-semibold text-paper sm:text-4xl">
            Something worth reporting nearby?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-canopy-200 dark:text-white-700">
            It takes under a minute to file, and you'll see every step until it's resolved.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-paper dark:bg-canopy-800 px-7 py-3 text-sm font-semibold text-canopy-800 dark:text-canopy-100 transition-transform hover:-translate-y-0.5"
          >
            Report an issue
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
