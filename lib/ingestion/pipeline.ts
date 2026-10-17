// The ingestion pipeline: SOURCE → FETCH → PARSE → NORMALIZE → DEDUPLICATE
// → CLASSIFY → VERIFY → DATABASE. Only metadata + short summaries are stored;
// full article text is never copied (copyright).

import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import {
  canonicalizeUrl,
  normalizeTitle,
  canonicalGroupKey,
  makeSummary,
} from "./normalize";
import { classifyCategory, detectMembers, verificationForLabel } from "./classify";
import { fetchFeed } from "./fetch";

export interface PipelineResult {
  sourceId: string;
  sourceName: string;
  fetched: number;
  inserted: number;
  duplicates: number;
  errors: string[];
}

const AUTO_PUBLISH = process.env.AUTO_PUBLISH === "true";

async function categoryIdFor(slug: string): Promise<string | null> {
  const cat = await prisma.category.findUnique({ where: { slug } });
  return cat?.id ?? null;
}

async function memberIdsFor(slugs: string[]): Promise<string[]> {
  if (!slugs.length) return [];
  const members = await prisma.member.findMany({ where: { slug: { in: slugs } } });
  return members.map((m) => m.id);
}

export async function runSource(sourceId: string): Promise<PipelineResult> {
  const source = await prisma.newsSource.findUnique({ where: { id: sourceId } });
  if (!source) throw new Error("Source not found");

  const log = await prisma.refreshLog.create({
    data: { sourceId, status: "running" },
  });

  const result: PipelineResult = {
    sourceId,
    sourceName: source.name,
    fetched: 0,
    inserted: 0,
    duplicates: 0,
    errors: [],
  };

  try {
    if (!source.enabled) {
      result.errors.push("Source is disabled");
      return result;
    }

    const items = await fetchFeed(source.url);
    result.fetched = items.length;

    for (const item of items) {
      try {
        const canonicalUrl = canonicalizeUrl(item.link);
        const normalized = normalizeTitle(item.title);
        const group = canonicalGroupKey(normalized);

        // DEDUPLICATE: exact URL already stored?
        const existingUrl = await prisma.newsUpdate.findUnique({
          where: { sourceUrl: canonicalUrl },
        });
        if (existingUrl) {
          result.duplicates++;
          continue;
        }

        // DEDUPLICATE: same story already covered by another source (48h window)?
        const since = new Date(Date.now() - 48 * 3600_000);
        const sameStory = await prisma.newsUpdate.findFirst({
          where: {
            canonicalGroup: group,
            createdAt: { gte: since },
            status: { in: ["PUBLISHED", "PENDING_REVIEW"] },
          },
          include: { _count: { select: { duplicates: true } } },
        });
        if (sameStory) {
          result.duplicates++;
          continue;
        }

        const summary = makeSummary(item.summary || item.title);
        const categorySlug = classifyCategory(item.title, summary);
        const memberSlugs = detectMembers(item.title, summary);
        const verificationStatus = verificationForLabel(source.label);

        const baseSlug = slugify(item.title) || `update-${Date.now()}`;
        let slug = baseSlug;
        for (let i = 1; ; i++) {
          const clash = await prisma.newsUpdate.findUnique({ where: { slug } });
          if (!clash) break;
          slug = `${baseSlug}-${i}`;
        }

        const [categoryId, memberIds] = await Promise.all([
          categoryIdFor(categorySlug),
          memberIdsFor(memberSlugs),
        ]);

        await prisma.newsUpdate.create({
          data: {
            slug,
            title: item.title.slice(0, 300),
            normalizedTitle: normalized,
            summary,
            imageUrl: item.imageUrl,
            sourceId: source.id,
            sourceName: source.name,
            sourceUrl: canonicalUrl,
            publishedAt: item.publishedAt,
            categoryId,
            verificationStatus,
            status: AUTO_PUBLISH ? "PUBLISHED" : "PENDING_REVIEW",
            canonicalGroup: group,
            members: { create: memberIds.map((memberId) => ({ memberId })) },
          },
        });
        result.inserted++;
      } catch (e) {
        result.errors.push(
          `item "${item.title.slice(0, 60)}": ${e instanceof Error ? e.message : "unknown"}`
        );
      }
    }

    await prisma.newsSource.update({
      where: { id: source.id },
      data: {
        lastFetchedAt: new Date(),
        lastStatus: result.errors.length ? "partial" : "ok",
        lastError: result.errors[0]?.slice(0, 500) ?? null,
        fetchCount: { increment: 1 },
      },
    });

    await prisma.refreshLog.update({
      where: { id: log.id },
      data: {
        finishedAt: new Date(),
        status: result.errors.length ? "partial" : "ok",
        itemsFetched: result.fetched,
        itemsInserted: result.inserted,
        error: result.errors[0]?.slice(0, 500) ?? null,
      },
    });

    return result;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    await prisma.newsSource.update({
      where: { id: source.id },
      data: { lastFetchedAt: new Date(), lastStatus: "error", lastError: message.slice(0, 500) },
    });
    await prisma.refreshLog.update({
      where: { id: log.id },
      data: { finishedAt: new Date(), status: "error", error: message.slice(0, 500) },
    });
    result.errors.push(message);
    return result;
  }
}

/** Run all enabled sources whose interval has elapsed. */
export async function runDueSources(): Promise<PipelineResult[]> {
  const sources = await prisma.newsSource.findMany({ where: { enabled: true } });
  const now = Date.now();
  const due = sources.filter((s) => {
    if (!s.lastFetchedAt) return true;
    return now - s.lastFetchedAt.getTime() >= s.fetchIntervalMin * 60_000;
  });
  const results: PipelineResult[] = [];
  for (const s of due) {
    results.push(await runSource(s.id));
  }
  return results;
}
