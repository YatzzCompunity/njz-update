import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bookmarkSchema, paginationSchema } from "@/lib/validation";
import { getSessionUser, unauthorized, badRequest } from "@/lib/auth-helpers";
import { reactionCounts, likedTargetIds, bookmarkedTargetIds } from "@/lib/reactions";

export async function GET(req: Request) {
  const me = await getSessionUser();
  if (!me) return unauthorized();

  const url = new URL(req.url);
  const parsed = paginationSchema.safeParse(Object.fromEntries(url.searchParams));
  const { page, limit } = parsed.success ? parsed.data : { page: 1, limit: 20 };
  const type = url.searchParams.get("type") as "POST" | "UPDATE" | null;

  const where: Record<string, unknown> = { userId: me.id };
  if (type === "POST" || type === "UPDATE") where.targetType = type;

  const [total, bookmarks] = await Promise.all([
    prisma.bookmark.count({ where }),
    prisma.bookmark.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  // Hydrate targets (polymorphic — resolved in code)
  const postIds = bookmarks.filter((b) => b.targetType === "POST").map((b) => b.targetId);
  const updateIds = bookmarks.filter((b) => b.targetType === "UPDATE").map((b) => b.targetId);
  const [posts, updates] = await Promise.all([
    postIds.length
      ? prisma.post.findMany({
          where: { id: { in: postIds }, hidden: false },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                image: true,
                profile: { select: { displayName: true } },
              },
            },
            _count: { select: { comments: true } },
          },
        })
      : [],
    updateIds.length
      ? prisma.newsUpdate.findMany({
          where: { id: { in: updateIds }, status: "PUBLISHED" },
          include: {
            category: { select: { name: true, slug: true } },
            members: { include: { member: { select: { name: true, slug: true } } } },
            source: { select: { label: true } },
          },
        })
      : [],
  ]);
  const postMap = new Map(posts.map((p) => [p.id, p]));
  const updateMap = new Map(updates.map((u) => [u.id, u]));

  const [postCounts, postLiked, postBookmarked] = await Promise.all([
    reactionCounts("POST", [...postMap.keys()]),
    likedTargetIds(me.id, "POST", [...postMap.keys()]),
    bookmarkedTargetIds(me.id, "POST", [...postMap.keys()]),
  ]);

  return NextResponse.json({
    bookmarks: bookmarks
      .map((b) => {
        if (b.targetType === "POST") {
          const p = postMap.get(b.targetId);
          if (!p) return null;
          return {
            id: b.id,
            targetType: b.targetType,
            createdAt: b.createdAt.toISOString(),
            target: {
              id: p.id,
              content: p.content,
              imageUrl: p.imageUrl,
              linkUrl: p.linkUrl,
              createdAt: p.createdAt.toISOString(),
              hidden: p.hidden,
              author: {
                id: p.author.id,
                username: p.author.username,
                image: p.author.image,
                displayName: p.author.profile?.displayName,
              },
              _count: {
                comments: p._count.comments,
                reactions: postCounts.get(p.id) ?? 0,
              },
              likedByMe: postLiked.has(p.id),
              bookmarkedByMe: postBookmarked.has(p.id),
            },
          };
        }
        const u = updateMap.get(b.targetId);
        if (!u) return null;
        return {
          id: b.id,
          targetType: b.targetType,
          createdAt: b.createdAt.toISOString(),
          target: {
            ...u,
            publishedAt: u.publishedAt?.toISOString() ?? null,
            createdAt: u.createdAt.toISOString(),
            sourceLabel: u.source?.label,
          },
        };
      })
      .filter(Boolean),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: Request) {
  const me = await getSessionUser();
  if (!me) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid request body");
  }
  const parsed = bookmarkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { targetType, targetId } = parsed.data;

  const existing = await prisma.bookmark.findUnique({
    where: { userId_targetType_targetId: { userId: me.id, targetType, targetId } },
  });

  let bookmarked: boolean;
  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    bookmarked = false;
  } else {
    await prisma.bookmark.create({ data: { userId: me.id, targetType, targetId } });
    bookmarked = true;
  }
  return NextResponse.json({ bookmarked });
}
