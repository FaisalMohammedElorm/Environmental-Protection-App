import Link from "next/link";
import { Compass } from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="relative overflow-hidden bg-mist dark:bg-canopy-800">
        <div className="absolute inset-0 bg-contour bg-cover opacity-70" aria-hidden />
        <div className="container-app relative flex flex-col items-center py-28 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-canopy-700/10 text-canopy-700 dark:text-canopy-200">
            <Compass className="h-7 w-7" strokeWidth={1.75} />
          </span>
          <p className="eyebrow mt-6">404</p>
          <h1 className="mt-2 text-3xl font-semibold text-canopy-800 dark:text-canopy-100 sm:text-4xl">
            This page wandered off the map
          </h1>
          <p className="mt-3 max-w-sm text-canopy-500 dark:text-canopy-400">
            The page you're looking for doesn't exist, or may have moved.
          </p>
          <Link href="/" className="btn-primary mt-8">
            Back to home
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
