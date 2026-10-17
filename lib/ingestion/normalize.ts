// Text normalization + deduplication helpers for the news pipeline.
// Pure functions — safe to unit test.

/** Canonical form of a URL for dedup: lowercase host, strip tracking params, drop fragment. */
export function canonicalizeUrl(raw: string): string {
  try {
    const u = new URL(raw.trim());
    u.hash = "";
    // Strip common tracking params
    const TRACKING = [
      "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
      "fbclid", "gclid", "mc_cid", "mc_eid", "igshid", "ref", "ref_src",
    ];
    for (const p of TRACKING) u.searchParams.delete(p);
    // Sort remaining params for stability
    u.searchParams.sort();
    let out = u.toString();
    // Drop trailing slash on bare paths for stability
    out = out.replace(/\/$/, "");
    return out.toLowerCase();
  } catch {
    return raw.trim().toLowerCase();
  }
}

/** Normalized title for cross-source duplicate detection. */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    // Strip common outlet suffixes like " - Soompi" / " | Koreaboo"
    .replace(/\s*[-|–—:]\s*[a-z0-9 .&'"]{2,40}$/i, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Group key: normalized title hashed — same story from different outlets shares a group. */
export function canonicalGroupKey(normalizedTitle: string): string {
  let h = 5381;
  for (let i = 0; i < normalizedTitle.length; i++) {
    h = ((h << 5) + h + normalizedTitle.charCodeAt(i)) >>> 0;
  }
  return `g${h.toString(36)}`;
}

/** Strip HTML tags and decode common entities — summaries must never contain markup. */
export function cleanHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Extract a short summary (never the full copyrighted article). */
export function makeSummary(raw: string, maxLen = 320): string {
  const clean = cleanHtml(raw);
  if (clean.length <= maxLen) return clean;
  const cut = clean.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > maxLen * 0.5 ? cut.slice(0, lastSpace) : cut) + "…";
}

/** Extract the best image URL from an RSS item, if any. */
export function extractImage(item: {
  enclosure?: { url?: string; type?: string };
  "media:content"?: { $?: { url?: string; medium?: string } } | Array<{ $?: { url?: string; medium?: string } }>;
  "media:thumbnail"?: { $?: { url?: string } };
  content?: string;
}): string | null {
  const enc = item.enclosure?.url;
  if (enc && /\.(jpe?g|png|webp|gif)(\?|$)/i.test(enc)) return enc;
  const mc = item["media:content"];
  if (mc) {
    const arr = Array.isArray(mc) ? mc : [mc];
    const img = arr.find((m) => m.$?.url && (!m.$?.medium || m.$.medium === "image"));
    if (img?.$?.url) return img.$.url;
  }
  const thumb = item["media:thumbnail"]?.$?.url;
  if (thumb) return thumb;
  if (item.content) {
    const m = item.content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (m) return m[1];
  }
  return null;
}
