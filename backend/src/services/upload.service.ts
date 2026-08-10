import { randomUUID } from "crypto";
import { supabaseAdmin } from "../config/supabaseAdmin";
import { ApiError } from "../utils/ApiError";

type Bucket = "avatars" | "reports";

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

function extensionFromMime(mimetype: string): string {
  if (mimetype === "image/png") return "png";
  if (mimetype === "image/webp") return "webp";
  return "jpg";
}

async function uploadToBucket(file: Express.Multer.File, bucket: Bucket, ownerId: string): Promise<string> {
  const path = `${ownerId}/${randomUUID()}.${extensionFromMime(file.mimetype)}`;

  const { error } = await supabaseAdmin.storage.from(bucket).upload(path, file.buffer, {
    contentType: file.mimetype,
    upsert: false
  });

  if (error) {
    throw ApiError.internal("Image upload failed");
  }

  if (bucket === "avatars") {
    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  // 'reports' is a private bucket — store the object path, not a URL. A
  // fresh signed URL is minted on read (see signReportImageUrls) so images
  // aren't permanently publicly accessible just because someone has the URL.
  return path;
}

export async function uploadImageBuffer(file: Express.Multer.File, bucket: Bucket, ownerId: string): Promise<string> {
  return uploadToBucket(file, bucket, ownerId);
}

export async function uploadReportImages(files: Express.Multer.File[], reporterId: string): Promise<string[]> {
  return Promise.all(files.map((file) => uploadToBucket(file, "reports", reporterId)));
}

export async function signReportImageUrls(paths: string[]): Promise<string[]> {
  if (paths.length === 0) return [];

  const { data, error } = await supabaseAdmin.storage.from("reports").createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  if (error || !data) {
    throw ApiError.internal("Could not generate image links");
  }

  return data.map((entry) => entry.signedUrl ?? "");
}
