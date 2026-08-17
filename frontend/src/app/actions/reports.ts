"use server";

import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isValidImageBuffer } from "@/lib/server/fileSignature";

// Report images live in a private Storage bucket that has no client-facing
// policies at all (see supabase/migrations/0009_storage_buckets.sql) — both
// writing and reading go through this service-role client instead, mirroring
// what the old Express backend's upload.service.ts did. The key is read only
// from process.env here, never NEXT_PUBLIC_, so it's never bundled to the browser.
function supabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.SUPABASE_SERVICE_ROLE_KEY as string, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

const MAX_FILES = 8;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const SIGNED_URL_TTL_SECONDS = 60 * 60;

function extensionFromMime(mimetype: string): string {
  if (mimetype === "image/png") return "png";
  if (mimetype === "image/webp") return "webp";
  return "jpg";
}

export type CreateReportActionResult = { id: string } | { error: string };

export async function createReportAction(formData: FormData): Promise<CreateReportActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const category = String(formData.get("category") ?? "");
  const description = String(formData.get("description") ?? "");
  const severity = String(formData.get("severity") ?? "");
  const address = String(formData.get("address") ?? "");
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length > MAX_FILES) return { error: `Attach at most ${MAX_FILES} images` };

  const { data: categoryRow, error: categoryError } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", category)
    .eq("is_active", true)
    .single();
  if (categoryError || !categoryRow) return { error: `"${category}" isn't a recognized, active category` };

  const admin = supabaseAdmin();
  const imagePaths: string[] = [];

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE_BYTES) return { error: "Each image must be 5MB or smaller" };
    if (!ALLOWED_MIME_TYPES.has(file.type)) return { error: "Only JPEG, PNG, or WEBP images are allowed" };

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!isValidImageBuffer(buffer)) return { error: "One of the images isn't a valid image file" };

    const path = `${user.id}/${randomUUID()}.${extensionFromMime(file.type)}`;
    const { error: uploadError } = await admin.storage.from("reports").upload(path, buffer, {
      contentType: file.type,
      upsert: false
    });
    if (uploadError) return { error: "Image upload failed" };
    imagePaths.push(path);
  }

  // Insert via the user-context client (not admin) so RLS's reports_insert_own
  // policy enforces reported_by = auth.uid() as defense in depth, not just a
  // value we trust this action set correctly.
  const { data: inserted, error: insertError } = await supabase
    .from("reports")
    .insert({
      category_id: categoryRow.id,
      severity,
      description,
      address,
      latitude,
      longitude,
      images: imagePaths,
      reported_by: user.id
    })
    .select("id")
    .single();

  if (insertError || !inserted) return { error: insertError?.message ?? "Could not create report" };
  return { id: inserted.id };
}

export async function getReportImageUrlsAction(reportId: string): Promise<string[]> {
  // Checked through the user's own RLS-scoped client first: if they can't
  // see this report (not the owner, not staff), this returns nothing — the
  // same access boundary assertCanAccessReport used to enforce.
  const supabase = await createSupabaseServerClient();
  const { data: report, error } = await supabase.from("reports").select("images").eq("id", reportId).single();
  if (error || !report || !report.images || report.images.length === 0) return [];

  const admin = supabaseAdmin();
  const { data, error: signError } = await admin.storage.from("reports").createSignedUrls(report.images, SIGNED_URL_TTL_SECONDS);
  if (signError || !data) return [];
  return data.map((entry) => entry.signedUrl ?? "").filter(Boolean);
}
