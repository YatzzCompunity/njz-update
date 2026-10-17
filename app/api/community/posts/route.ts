import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postSchema, paginationSchema } from "@/lib/validation";
import { getSessionUser, unauthorized, badRequest, tooManyRequests } from "@/lib/auth-helpers";
import { rateLimit, pruneBuckets } from "@/lib/rate-limit";
import { notifyMentions } from "@/lib/notifications";
import { reactionCounts, likedTargetIds, bookmarkedTargetIds } from "@/lib/reactions";

const authorSelect = {
  select: {
    id: true,
    username: true,
    image: true,
    profile: { select: { displayName: true } },
  },
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = paginationSchema.safeParse(Object.fromEntries(url.searchParams));
  const { page, limit } = parsed.success ? parsed.data : { page: 1, limit: 20 };

  const me = await getSessionUser().catch(() => null);

  const [total, posts] = await Promise.all([
    prisma.post.count({ where: { hidden: false } }),
    prisma.post.findMany({
      where: { hidden: false },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: authorSelect,
        _count: { select: { comments: true } },
      },
    }),
  ]);

  const ids = posts.map((p) => p.id);
  const [counts, liked, bookmarked] = await Promise.all([
    reactionCounts("POST", ids),
    likedTargetIds(me?.id, "POST", ids),
    bookmarkedTargetIds(me?.id, "POST", ids),
  ]);

  return NextResponse.json({
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
      _count: { comments: p._count.comments, reactions: counts.get(p.id) ?? 0 },
      likedByMe: liked.has(p.id),
      bookmarkedByMe: bookmarked.has(p.id),
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: Request) {
  pruneBuckets();
  const me = await getSessionUser();
  if (!me) return unauthorized();

  const rl = rateLimit(`post:${me.id}`, { limit: 10, windowSec: 600, prefix: "community" });
  if (!rl.allowed) return tooManyRequests("You're posting too fast — take a breath");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid request body");
  }
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const post = await prisma.post.create({
    data: {
      authorId: me.id,
      content: parsed.data.content.trim(),
      imageUrl: parsed.data.imageUrl || null,
      linkUrl: parsed.data.linkUrl || null,
    },
    include: { author: authorSelect, _count: { select: { comments: true } } },
  });

  // @mentions → notifications (best-effort)
  notifyMentions(post.content, me.id, "/community", `@${me.username} mentioned you in a post`);

  return NextResponse.json({ post }, { status: 201 });
}
