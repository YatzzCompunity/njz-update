// Keyword-based classification + member detection.
// Rule-based on purpose: transparent, deterministic, and it never invents facts.
// (An optional AI pass can refine these later — see lib/ingestion/ai.ts notes.)

export type CategorySlug =
  | "official"
  | "news"
  | "music"
  | "appearance"
  | "social-media"
  | "schedule"
  | "member-updates";

const CATEGORY_KEYWORDS: Array<{ slug: CategorySlug; keywords: string[] }> = [
  {
    slug: "official",
    keywords: ["official statement", "official announcement", "ador", "hybe", "agency confirms", "agency stated", "lawsuit", "contract"],
  },
  {
    slug: "music",
    keywords: ["album", "single", "mv", "music video", "teaser", "comeback", "track", "song", "debut", "ep ", "release", "billboard", "chart", "spotify", "streaming"],
  },
  {
    slug: "appearance",
    keywords: ["concert", "tour", "performance", "festival", "fan meeting", "fanmeeting", "event", "stage", "awards", "red carpet", "showcase"],
  },
  {
    slug: "social-media",
    keywords: ["instagram", "tiktok", "twitter", " x ", "youtube", "weverse", "phoning", "livestream", "live stream", "vlog", "posted"],
  },
  {
    slug: "schedule",
    keywords: ["schedule", "tour dates", "upcoming", "announced dates", "itinerary", "calendar"],
  },
  {
    slug: "member-updates",
    keywords: ["minji", "hanni", "danielle", "haerin", "hyein"],
  },
];

export function classifyCategory(title: string, summary: string): CategorySlug {
  const text = ` ${title} ${summary} `.toLowerCase();
  let best: CategorySlug = "news";
  let bestScore = 0;
  for (const { slug, keywords } of CATEGORY_KEYWORDS) {
    let score = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) score += kw.trim().split(" ").length; // multi-word = stronger signal
    }
    if (score > bestScore) {
      bestScore = score;
      best = slug;
    }
  }
  return best;
}

// Member detection — matches stage names and common romanizations.
const MEMBER_PATTERNS: Array<{ slug: string; patterns: RegExp[] }> = [
  { slug: "minji", patterns: [/\bminji\b/i] },
  { slug: "hanni", patterns: [/\bhanni\b/i, /pham hanni/i] },
  { slug: "danielle", patterns: [/\bdanielle\b/i, /danielle marsh/i] },
  { slug: "haerin", patterns: [/\bhaerin\b/i, /kang haerin/i] },
  { slug: "hyein", patterns: [/\bhyein\b/i, /lee hyein/i] },
];

/** Return member slugs mentioned in the text. Pure function — no invented facts. */
export function detectMembers(title: string, summary: string): string[] {
  const text = `${title} ${summary}`;
  const found: string[] = [];
  for (const { slug, patterns } of MEMBER_PATTERNS) {
    if (patterns.some((p) => p.test(text))) found.push(slug);
  }
  return found;
}

/**
 * Verification mapping from source label.
 * - OFFICIAL sources (verified label from admin) → VERIFIED
 * - NEWS outlets → UNVERIFIED by default; an editor promotes to VERIFIED after review
 * - COMMUNITY / UNVERIFIED → UNVERIFIED, always shown with the badge
 */
export function verificationForLabel(
  label: "OFFICIAL" | "NEWS" | "COMMUNITY" | "UNVERIFIED"
): "VERIFIED" | "UNVERIFIED" | "PENDING" {
  switch (label) {
    case "OFFICIAL":
      return "VERIFIED";
    case "NEWS":
      return "PENDING";
    default:
      return "UNVERIFIED";
  }
}
