import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { blogPosts } from "@/lib/mock-data";

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = blogPosts.find((p) => p.slug === params.slug);
  if (!post) return { title: "Post not found — EcoAlert" };
  return { title: `${post.title} — EcoAlert`, description: post.excerpt };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = blogPosts.find((p) => p.slug === params.slug);
  if (!post) notFound();

  return (
    <>
      <Navbar />
      <main className="container-app max-w-2xl py-16">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-canopy-600 dark:text-canopy-300 hover:text-canopy-800 dark:hover:text-canopy-100">
          <ArrowLeft className="h-4 w-4" />
          Back to blog
        </Link>

        <span className="eyebrow mb-3 mt-8 block">{post.category}</span>
        <h1 className="text-3xl font-semibold text-canopy-800 dark:text-canopy-100 sm:text-4xl">{post.title}</h1>
        <p className="mt-3 text-sm text-canopy-400 dark:text-canopy-500">
          {post.author} ·{" "}
          {new Date(post.publishedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} ·{" "}
          {post.readMinutes} min read
        </p>

        <div className="mt-10 flex flex-col gap-5">
          {post.content.map((paragraph, i) => (
            <p key={i} className="text-base leading-relaxed text-canopy-600 dark:text-canopy-300">
              {paragraph}
            </p>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
