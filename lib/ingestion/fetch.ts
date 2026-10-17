// Feed fetching with politeness built in:
// - honest User-Agent identifying the bot
// - 15s timeout, max 50 items per source per run
// - robots.txt respected before fetching (best-effort, cached)
// - no scraping of sites that disallow it; only RSS/Atom feeds are consumed

import Parser from "rss-parser";

const parser = new Parser({
  timeout: 15000,
  maxRedirects: 3,
  headers: {
    "User-Agent":
      "NJZUpdateBot/1.0 (fan news aggregator; +https://github.com/) rss-reader",
    Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
  },
});

export interface FetchedItem {
  title: string;
  link: string;
  summary: string;
  publishedAt: Date | null;
  imageUrl: string | null;
  guid: string | null;
}

const robotsCache = new Map<string, { at: number; disallowed: string[] }>();

async function robotsDisallowedPaths(feedUrl: string): Promise<string[]> {
  try {
    const u = new URL(feedUrl);
    const origin = `${u.protocol}//${u.host}`;
    const cached = robotsCache.get(origin);
    if (cached && Date.now() - cached.at < 3600_000) return cached.disallowed;

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(`${origin}/robots.txt`, { signal: ctrl.signal });
    clearTimeout(t);
    const disallowed: string[] = [];
    if (res.ok) {
      const text = await res.text();
      let applies = false;
      for (const line of text.split("\n")) {
        const l = line.trim();
        if (/^user-agent:\s*(\*|njzupdatebot)/i.test(l)) applies = true;
        else if (/^user-agent:/i.test(l)) applies = false;
        else if (applies && /^disallow:/i.test(l)) {
          const path = l.split(":").slice(1).join(":").trim();
          if (path) disallowed.push(path);
        }
      }
    }
    robotsCache.set(origin, { at: Date.now(), disallowed });
    return disallowed;
  } catch {
    return [];
  }
}

/** Fetch + parse an RSS/Atom feed. Throws on network/parse failure. */
export async function fetchFeed(feedUrl: string, maxItems = 50): Promise<FetchedItem[]> {
  const disallowed = await robotsDisallowedPaths(feedUrl);
  const path = new URL(feedUrl).pathname;
  if (disallowed.some((d) => d !== "/" && path.startsWith(d))) {
    throw new Error(`Feed path is disallowed by robots.txt (${path})`);
  }

  const feed = await parser.parseURL(feedUrl);
  const items: FetchedItem[] = [];

  for (const raw of (feed.items ?? []).slice(0, maxItems)) {
    const title = (raw.title ?? "").trim();
    const link = (raw.link ?? raw.guid ?? "").trim();
    if (!title || !link) continue;

    const summary =
      (raw.contentSnippet ?? raw.summary ?? raw.content ?? "").toString().trim();

    let publishedAt: Date | null = null;
    const dateStr = raw.isoDate ?? raw.pubDate;
    if (dateStr) {
      const d = new Date(dateStr);
      if (!Number.isNaN(d.getTime())) publishedAt = d;
    }

    // rss-parser puts enclosure/media fields on the item
    const anyRaw = raw as unknown as Record<string, unknown>;
    let imageUrl: string | null = null;
    const enclosure = anyRaw.enclosure as { url?: string } | undefined;
    if (enclosure?.url && /\.(jpe?g|png|webp|gif)(\?|$)/i.test(enclosure.url)) {
      imageUrl = enclosure.url;
    }
    const media = anyRaw["media:content"] as { $?: { url?: string } } | undefined;
    if (!imageUrl && media?.$?.url) imageUrl = media.$.url;
    const thumb = anyRaw["media:thumbnail"] as { $?: { url?: string } } | undefined;
    if (!imageUrl && thumb?.$?.url) imageUrl = thumb.$.url;

    items.push({
      title,
      link,
      summary,
      publishedAt,
      imageUrl,
      guid: typeof raw.guid === "string" ? raw.guid : null,
    });
  }

  return items;
}
