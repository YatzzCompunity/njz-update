export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { HomeContent } from "@/components/home-content";
import { getSessionUser } from "@/lib/auth-helpers";
import { reactionCounts, likedTargetIds, bookmarkedTargetIds } from "@/lib/reactions";

async function getHomeData() {
  const [latest, trending, members, posts] = await Promise.all([
    prisma.newsUpdate.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 6,
      include: {
        category: { select: { name: true, slug: true } },
        members: { include: { member: { select: { name: true, slug: true } } } },
        source: { select: { label: true } },
      },
    }),
    prisma.newsUpdate.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { viewCount: "desc" },
      take: 4,
      include: {
        category: { select: { name: true, slug: true } },
        members: { include: { member: { select: { name: true, slug: true } } } },
        source: { select: { label: true } },
      },
    }),
    prisma.member.findMany({ where: { active: true }, orderBy: { order: "asc" } }),
    prisma.post.findMany({
      where: { hidden: false },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: {
        author: { select: { id: true, username: true, image: true, profile: { select: { displayName: true } } } },
        _count: { select: { comments: true } },
      },
    }),
  ]);
  return { latest, trending, members, posts };
}

const toUpdate = (u: any) => ({
  ...u,
  publishedAt: u.publishedAt?.toISOString() ?? null,
  createdAt: u.createdAt.toISOString(),
  sourceLabel: u.source?.label,
});

export default async function HomePage() {
  const sessionUser = await getSessionUser().catch(() => null);
  const { latest, trending, members, posts } = await getHomeData().catch(() => ({
    latest: [], trending: [], members: [], posts: [],
  }));

  const myId = sessionUser?.id;
  const postIds = posts.map((p) => p.id);
  const [postCounts, likedSet, bookmarkedSet] = await Promise.all([
    reactionCounts("POST", postIds),
    likedTargetIds(myId, "POST", postIds),
    bookmarkedTargetIds(myId, "POST", postIds),
  ]);

  return (
    <HomeContent
      latest={latest.map(toUpdate)}
      trending={trending.map(toUpdate)}
      members={members.map((m: any) => ({
        ...m,
        createdAt: m.createdAt?.toISOString?.() ?? null,
        updatedAt: m.updatedAt?.toISOString?.() ?? null,
      }))}
      posts={posts.map((p: any) => ({
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
        _count: { comments: p._count.comments, reactions: postCounts.get(p.id) ?? 0 },
        likedByMe: likedSet.has(p.id),
        bookmarkedByMe: bookmarkedSet.has(p.id),
      }))}
      sessionUser={sessionUser ? { id: sessionUser.id } : null}
    />
  );
}
