import { notFound } from "next/navigation";

// Dev-only screenshot previews of the staff dashboards, rendered with sample
// data instead of Supabase. Lives outside /officer and /admin so it never
// touches the auth middleware, and 404s in any production build.
export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV !== "development") notFound();
  return children;
}
