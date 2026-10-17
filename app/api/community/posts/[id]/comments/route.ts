import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { commentSchema } from "@/lib/validation";
import { getSessionUser, unauthorized, tooManyRequests } from "@/lib/auth-helpers";
import { rateLimit, pruneBuckets } from "@/lib/rate-limit";
import { notify, notifyMentions } from "@/lib/notifications";
import { reactionCounts, likedTargetIds } from "@/lib/reactions";

const authorSelect = {
  select: { id: true, username: true, image: true, profile: { select: { displayName: true } } },
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  const me = await getSessionUser().catch(() => null);

  const comments = await prisma.comment.findMany({
    where: { postId, parentId: null, hidden: false },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: {
      author: authorSelect,
      replies: {
        where: { hidden: false },
        orderBy: { createdAt: "asc" },
        take: 50,
        include: {
          author: authorSelect,
        },
      },
    },
  });

  const ids = comments.flatMap((c) => [c.id, ...c.replies.map((r) => r.id)]);
  const [counts, liked] = await Promise.all([
    reactionCounts("COMMENT", ids),
    likedTargetIds(me?.id, "COMMENT", ids),
  ]);

  const shape = (c: {
    id: string;
    content: string;
    createdAt: Date;
    parentId: string | null;
    author: {
      id: string;
      username: string | null;
      image: string | null;
      profile: { displayName: string | null } | null;
    };
  }) => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    parentId: c.parentId,
    author: {
      id: c.author.id,
      username: c.author.username,
      image: c.author.image,
      displayName: c.author.profile?.displayName,
    },
    _count: { comments: 0, reactions: counts.get(c.id) ?? 0 },
    likedByMe: liked.has(c.id),
  });

  return NextResponse.json({
    comments: comments.map((c) => ({ ...shape(c), replies: c.replies.map(shape) })),
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  pruneBuckets();
  const { id: postId } = await params;
  const me = await getSessionUser();
  if (!me) return unauthorized();

  const rl = rateLimit(`comment:${me.id}`, { limit: 20, windowSec: 600, prefix: "community" });
  if (!rl.allowed) return tooManyRequests("You're commenting too fast");

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true, hidden: true },
  });
  if (!post || post.hidden) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  if (parsed.data.parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: parsed.data.parentId },
      select: { id: true, postId: true },
    });
    if (!parent || parent.postId !== postId) {
      return NextResponse.json({ error: "Invalid parent comment" }, { status: 400 });
    }
  }

  const comment = await prisma.comment.create({
    data: {
      postId,
      authorId: me.id,
      parentId: parsed.data.parentId ?? null,
      content: parsed.data.content.trim(),
    },
  });

  // Notify post author about the reply (best-effort)
  if (post.authorId !== me.id) {
    notify(post.authorId, "REPLY", `@${me.username} replied to your post`, {
      body: comment.content.slice(0, 140),
      link: "/community",
    });
  }
  notifyMentions(comment.content, me.id, "/community", `@${me.username} mentioned you in a comment`);

  return NextResponse.json({ comment }, { status: 201 });
}
