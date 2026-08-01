import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

interface StaticPageShellProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function StaticPageShell({ eyebrow, title, subtitle, children }: StaticPageShellProps) {
  return (
    <>
      <Navbar />
      <main>
        <section className="relative overflow-hidden bg-mist dark:bg-canopy-800">
          <div className="absolute inset-0 bg-contour bg-cover opacity-70" aria-hidden />
          <div className="container-app relative py-16 sm:py-20">
            <span className="eyebrow mb-3 block">{eyebrow}</span>
            <h1 className="max-w-2xl text-4xl font-semibold text-canopy-800 dark:text-canopy-100 sm:text-5xl">{title}</h1>
            {subtitle && <p className="mt-4 max-w-xl text-canopy-500 dark:text-canopy-400">{subtitle}</p>}
          </div>
        </section>
        <div className="container-app py-16">{children}</div>
      </main>
      <Footer />
    </>
  );
}
