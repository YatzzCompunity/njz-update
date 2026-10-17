// Storage abstraction: Supabase Storage when configured, otherwise the app
// stores remote image URLs by reference (no local filesystem — serverless safe).

export async function uploadImage(
  _fileName: string,
  _bytes: Uint8Array,
  _contentType: string
): Promise<{ url: string } | { error: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return {
      error:
        "Image uploads are not configured (Supabase Storage env vars missing). " +
        "Paste an image URL instead, or set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    };
  }
  // Real implementation would stream to the `uploads` bucket here.
  // Kept as a documented seam: wire your bucket policy, then upload via the
  // Supabase JS client with the service-role key (server-side only).
  return { error: "Supabase Storage upload is not wired to a bucket yet. See README." };
}

/** Validate an uploaded image before it ever touches storage. */
export function validateImageUpload(
  sizeBytes: number,
  contentType: string
): string | null {
  const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const MAX = 5 * 1024 * 1024; // 5 MB
  if (!ALLOWED.includes(contentType)) {
    return `Unsupported image type. Allowed: ${ALLOWED.join(", ")}`;
  }
  if (sizeBytes > MAX) return "Image is too large (max 5 MB)";
  return null;
}
