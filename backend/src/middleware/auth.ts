import type { NextFunction, Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";
import { sql } from "../config/db";
import type { UserRole } from "../types/enums";
import { catchAsync } from "../utils/catchAsync";

interface ProfileRow {
  id: string;
  name: string;
  role: UserRole;
  is_active: boolean;
}

// Supabase signs access tokens with a per-project asymmetric key (ES256) by
// default — the "JWT Secret" in the dashboard is only the legacy HS256
// fallback and won't verify these. jwtVerify() looks up the right public
// key from Supabase's JWKS endpoint by the token's `kid`, and jose caches
// the key set (with its own TTL/cooldown) so this isn't a fetch per request.
const jwks = createRemoteJWKSet(new URL("/auth/v1/.well-known/jwks.json", env.supabase.url));

export const protect = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    throw ApiError.unauthorized("You must be logged in to access this resource");
  }

  let sub: string;
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: new URL("/auth/v1", env.supabase.url).toString()
    });
    if (!payload.sub) throw new Error("missing sub claim");
    sub = payload.sub;
  } catch {
    throw ApiError.unauthorized("Your session is no longer valid");
  }

  const [profile] = await sql<ProfileRow[]>`
    select id, name, role, is_active from public.profiles where id = ${sub}
  `;

  if (!profile || !profile.is_active) {
    throw ApiError.unauthorized("Your session is no longer valid");
  }

  req.user = { id: profile.id, name: profile.name, role: profile.role };
  next();
});

export function restrictTo(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(ApiError.forbidden("You don't have permission to perform this action"));
      return;
    }
    next();
  };
}
