import { sql } from "../config/db";
import { ApiError } from "../utils/ApiError";
import { serializeUser, type PublicUser, type ProfileRow } from "../utils/serializers/user.serializer";
import { uploadImageBuffer } from "./upload.service";

interface UpdateProfileInput {
  name?: string;
  phone?: string;
}

const profileColumns = () => sql`id, name, email, role, phone, avatar_url, is_active, created_at`;

export async function updateProfile(userId: string, updates: UpdateProfileInput): Promise<PublicUser> {
  const [row] = await sql<ProfileRow[]>`
    update public.profiles
    set
      name = coalesce(${updates.name ?? null}::text, name),
      phone = coalesce(${updates.phone ?? null}::text, phone)
    where id = ${userId}
    returning ${profileColumns()}
  `;
  if (!row) throw ApiError.notFound("User not found");
  return serializeUser(row);
}

export async function updateAvatar(userId: string, file: Express.Multer.File): Promise<PublicUser> {
  const avatarUrl = await uploadImageBuffer(file, "avatars", userId);

  const [row] = await sql<ProfileRow[]>`
    update public.profiles set avatar_url = ${avatarUrl} where id = ${userId}
    returning ${profileColumns()}
  `;
  if (!row) throw ApiError.notFound("User not found");
  return serializeUser(row);
}
