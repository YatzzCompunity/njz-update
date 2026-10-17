import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reactionCounts } from "@/lib/reactions";
import { z } from "zod";

const querySchema = z.object({
  q: z.string().min(1).max(100),
  tab: z.enum(["all", "updates", "members", "community"]).default("all"),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    tab: url.searchParams.get("tab") ?? "all",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing or invalid search query" }, { status: 400 });
  }
  const { q, tab } = parsed.data;

  const [updates, members, posts] = await Promise.all([
    tab === "all" || tab === "updates"
      ? prisma.newsUpdate.findMany({
          where: {
            status: "PUBLISHED",
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { summary: { contains: q, mode: "insensitive" } },
            ],
          },
          orderBy: { publishedAt: "desc" },
          take: 10,
          include: {
            category: { select: { name: true, slug: true } },
            members: { include: { member: { select: { name: true, slug: true } } } },
            source: { select: { label: true } },
          },
        })
      : [],
    tab === "all" || tab === "members"
      ? prisma.member.findMany({
          where: {
            active: true,
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { nickname: { contains: q, mode: "insensitive" } },
            ],
          },
          take: 5,
        })
      : [],
    tab === "all" || tab === "community"
      ? prisma.post.findMany({
          where: { hidden: false, content: { contains: q, mode: "insensitive" } },
          orderBy: { createdAt: "desc" },
          take: 10,
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
  ]);

  const postCounts = await reactionCounts(
    "POST",
    posts.map((p) => p.id)
  );

  return NextResponse.json({
    q,
    updates: updates.map((u) => ({ ...u, sourceLabel: u.source?.label })),
    members,
    posts: posts.map((p) => ({
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
      likedByMe: false,
      bookmarkedByMe: false,
    })),
    counts: { updates: updates.length, members: members.length, posts: posts.length },
  });
}
