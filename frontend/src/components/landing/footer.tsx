import Link from "next/link";
import { Leaf } from "lucide-react";

const columns = [
  {
    heading: "Product",
    links: [
      { href: "/how-it-works", label: "How it works" },
      { href: "/#features", label: "Features" },
      { href: "/#reports", label: "Live reports" }
    ]
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/blog", label: "Blog" },
      { href: "/contact", label: "Contact" }
    ]
  },
  {
    heading: "Legal",
    links: [
      { href: "/privacy-policy", label: "Privacy policy" },
      { href: "/terms-of-service", label: "Terms of service" }
    ]
  },
  {
    heading: "Support",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact support" }
    ]
  }
];

export function Footer() {
  return (
    <footer className="border-t border-canopy-100 dark:border-canopy-700 bg-paper dark:bg-canopy-800">
      <div className="container-app grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold text-canopy-800 dark:text-canopy-100">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-canopy-700 text-paper">
              <Leaf className="h-4 w-4" strokeWidth={2.25} />
            </span>
            EcoAlert
          </Link>
          <p className="mt-4 max-w-xs text-sm text-canopy-500 dark:text-canopy-400">
            Environmental reporting that closes the loop — from sighting to resolution.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.heading}>
            <h3 className="eyebrow mb-4">{col.heading}</h3>
            <ul className="space-y-3">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-canopy-500 dark:text-canopy-400 hover:text-canopy-800 dark:hover:text-canopy-100">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="container-app flex flex-col gap-2 border-t border-canopy-100 dark:border-canopy-700 py-6 text-xs text-canopy-400 dark:text-canopy-500 sm:flex-row sm:justify-between">
        <span>&copy; {new Date().getFullYear()} EcoAlert. All rights reserved.</span>
        <span>Built for cleaner, safer communities.</span>
      </div>
    </footer>
  );
}
