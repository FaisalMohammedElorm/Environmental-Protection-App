import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Each role has exactly one home area — an admin visiting /dashboard (the
// citizen area) gets redirected to /admin, not let through. Not a security
// boundary (the API already scopes what each role can do/see regardless of
// which frontend route they're on) — this is purely about keeping one
// canonical destination per role instead of three overlapping ones.
const PROTECTED_PREFIXES: Array<{ prefix: string; roles: string[] }> = [
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/officer", roles: ["officer"] },
  { prefix: "/dashboard", roles: ["citizen"] }
];

function roleHome(role: string): string {
  if (role === "admin") return "/admin";
  if (role === "officer") return "/officer";
  return "/dashboard";
}

// Protects /dashboard, /admin, /officer server-side — before this, those
// layouts only fetched the user client-side and never redirected, so a
// logged-out visitor could see the protected page's shell render (and any
// direct URL entry worked regardless of role) before any auth check ran.
export async function middleware(request: NextRequest) {
  const match = PROTECTED_PREFIXES.find((p) => request.nextUrl.pathname.startsWith(p.prefix));
  if (!match) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = (profile?.role as string | undefined) ?? "citizen";

  if (!match.roles.includes(role)) {
    return NextResponse.redirect(new URL(roleHome(role), request.url));
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/officer/:path*"]
};
