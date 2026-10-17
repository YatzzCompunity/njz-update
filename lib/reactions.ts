import { prisma } from "@/lib/prisma";
import type { TargetType } from "@prisma/client";

/**
 * Reaction counts for polymorphic targets.
 * (Reaction/Bookmark/Follow use plain targetType+targetId columns instead of
 * Prisma relations, so `_count` can't aggregate them — resolve in code.)
 */
export async function reactionCounts(
  targetType: TargetType,
  targetIds: string[]
): Promise<Map<string, number>> {
  if (!targetIds.length) return new Map();
  const rows = await prisma.reaction.groupBy({
    by: ["targetId"],
    where: { targetType, targetId: { in: targetIds } },
    _count: { targetId: true },
  });
  return new Map(rows.map((r) => [r.targetId, r._count.targetId]));
}

/** Target ids the user has reacted to (for liked-by-me UI state). */
export async function likedTargetIds(
  userId: string | null | undefined,
  targetType: TargetType,
  targetIds: string[]
): Promise<Set<string>> {
  if (!userId || !targetIds.length) return new Set();
  const rows = await prisma.reaction.findMany({
    where: { userId, targetType, targetId: { in: targetIds } },
    select: { targetId: true },
  });
  return new Set(rows.map((r) => r.targetId));
}

/** Target ids the user has bookmarked. */
export async function bookmarkedTargetIds(
  userId: string | null | undefined,
  targetType: TargetType,
  targetIds: string[]
): Promise<Set<string>> {
  if (!userId || !targetIds.length) return new Set();
  const rows = await prisma.bookmark.findMany({
    where: { userId, targetType, targetId: { in: targetIds } },
    select: { targetId: true },
  });
  return new Set(rows.map((r) => r.targetId));
}
