import type { Metadata } from "next";
import Link from "next/link";
import { StaticPageShell } from "@/components/ui/static-page-shell";
import { blogPosts } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Blog — EcoAlert",
  description: "Notes on product decisions, engineering, and what the reporting data tells us."
};

export default function BlogIndexPage() {
  return (
    <StaticPageShell
      eyebrow="Blog"
      title="Notes from the field and the codebase"
      subtitle="How we build EcoAlert, and what the reports themselves keep teaching us."
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {blogPosts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="card flex flex-col p-8 hover:border-canopy-300 dark:hover:border-canopy-500">
            <span className="eyebrow mb-3">{post.category}</span>
            <h2 className="font-display text-lg font-semibold text-canopy-800 dark:text-canopy-100">{post.title}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-canopy-500 dark:text-canopy-400">{post.excerpt}</p>
            <p className="mt-6 text-xs text-canopy-400 dark:text-canopy-500">
              {new Date(post.publishedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} ·{" "}
              {post.readMinutes} min read
            </p>
          </Link>
        ))}
      </div>
    </StaticPageShell>
  );
}
