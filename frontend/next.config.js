/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Matches any Supabase project's Storage URLs (avatars + signed report
      // image links) without hardcoding this project's ref, so it keeps
      // working if you ever point the app at a different Supabase project.
      { protocol: "https", hostname: "*.supabase.co" }
    ]
  }
};

module.exports = nextConfig;
