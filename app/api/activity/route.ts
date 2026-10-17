import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Aggregated recent activity for the homepage "Live Activity" widget.
export async function GET() {
  try {
    const [updates, posts, comments, users] = await Promise.all([
      prisma.newsUpdate.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        take: 4,
        select: { id: true, title: true, createdAt: true, members: { include: { member: { select: { name: true } } } } },
      }),
      prisma.post.findMany({
        where: { hidden: false },
        orderBy: { createdAt: "desc" },
        take: 4,
        select: { id: true, createdAt: true, author: { select: { username: true } } },
      }),
      prisma.comment.findMany({
        where: { hidden: false },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { id: true, createdAt: true, author: { select: { username: true } }, postId: true },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 2,
        select: { id: true, username: true, createdAt: true },
      }),
    ]);

    const items = [
      ...updates.map((u) => ({
        id: `u-${u.id}`,
        kind: "update" as const,
        text: `New update${u.members.length ? ` about ${u.members.map((m) => m.member.name).join(", ")}` : ""}: ${u.title}`,
        at: u.createdAt.toISOString(),
        link: `/updates/${u.id}`,
      })),
      ...posts.map((p) => ({
        id: `p-${p.id}`,
        kind: "post" as const,
        text: `@${p.author.username ?? "bunny"} posted in Community`,
        at: p.createdAt.toISOString(),
        link: "/community",
      })),
      ...comments.map((c) => ({
        id: `c-${c.id}`,
        kind: "comment" as const,
        text: `@${c.author.username ?? "bunny"} commented on a post`,
        at: c.createdAt.toISOString(),
        link: "/community",
      })),
      ...users.map((u) => ({
        id: `user-${u.id}`,
        kind: "user" as const,
        text: `@${u.username ?? "bunny"} joined the community`,
        at: u.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => +new Date(b.at) - +new Date(a.at))
      .slice(0, 10);

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
