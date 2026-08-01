import Link from "next/link";
import { Leaf } from "lucide-react";

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthLayout({ eyebrow, title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-20">
        <Link href="/" className="mb-10 flex items-center gap-2 font-display text-lg font-semibold text-canopy-800 dark:text-canopy-100">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-canopy-700 text-paper">
            <Leaf className="h-4 w-4" strokeWidth={2.25} />
          </span>
          EcoAlert
        </Link>

        <div className="mx-auto w-full max-w-sm">
          <span className="eyebrow mb-3 block">{eyebrow}</span>
          <h1 className="text-3xl font-semibold text-canopy-800 dark:text-canopy-100">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-canopy-500 dark:text-canopy-400">{subtitle}</p>}

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-8 text-sm text-canopy-500 dark:text-canopy-400">{footer}</div>}
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-canopy-800 lg:block">
        <div className="absolute inset-0 bg-contour bg-cover opacity-30 invert" aria-hidden />
        <div className="relative flex h-full flex-col justify-end p-16">
          <blockquote className="max-w-md font-display text-2xl leading-snug text-paper">
            &ldquo;I reported a blocked drain outside my shop and watched it go from new to fixed in
            four days.&rdquo;
          </blockquote>
          <p className="mt-4 text-sm text-canopy-200 dark:text-canopy-700">Kwesi Boateng — Citizen reporter, Accra</p>
        </div>
      </div>
    </div>
  );
}
