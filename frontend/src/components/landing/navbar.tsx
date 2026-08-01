"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Leaf } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const links = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#reports", label: "Live reports" },
  { href: "#testimonials", label: "Stories" },
  { href: "/contact", label: "Contact" }
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-canopy-100/70 dark:border-canopy-700/70 bg-paper/80 dark:bg-canopy-800/80 backdrop-blur-md">
      <nav className="container-app flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold text-canopy-800 dark:text-canopy-100">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-canopy-700 text-paper">
            <Leaf className="h-4 w-4" strokeWidth={2.25} />
          </span>
          EcoAlert
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-canopy-600 dark:text-canopy-300 transition-colors hover:text-canopy-800 dark:hover:text-canopy-100"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Link href="/login" className="text-sm font-semibold text-canopy-700 dark:text-canopy-200 hover:text-canopy-800 dark:hover:text-canopy-100">
            Log in
          </Link>
          <Link href="/register" className="btn-primary">
            Report an issue
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            aria-label="Toggle menu"
            className="text-canopy-800 dark:text-canopy-100"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-canopy-100 dark:border-canopy-700 bg-paper dark:bg-canopy-800 px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {links.map((link) => (
              <a key={link.href} href={link.href} className="text-sm font-medium text-canopy-700 dark:text-canopy-200">
                {link.label}
              </a>
            ))}
            <div className="flex gap-3 pt-2">
              <Link href="/login" className="btn-secondary flex-1">
                Log in
              </Link>
              <Link href="/register" className="btn-primary flex-1">
                Report
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
