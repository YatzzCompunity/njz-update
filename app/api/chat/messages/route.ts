import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { chatMessageSchema, paginationSchema } from "@/lib/validation";
import { getSessionUser, unauthorized, badRequest, tooManyRequests } from "@/lib/auth-helpers";
import { rateLimit, pruneBuckets } from "@/lib/rate-limit";
import { notifyMentions } from "@/lib/notifications";

async function getRoom(slug: string) {
  let room = await prisma.chatRoom.findUnique({ where: { slug } });
  if (!room) {
    room = await prisma.chatRoom.create({
      data: { slug, name: slug === "global" ? "Bunnies Global Chat" : slug },
    });
  }
  return room;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const roomSlug = url.searchParams.get("room") ?? "global";
  const q = paginationSchema.safeParse(Object.fromEntries(url.searchParams));
  const limit = q.success ? q.data.limit : 50;
  const before = url.searchParams.get("before");

  const room = await getRoom(roomSlug);
  const messages = await prisma.chatMessage.findMany({
    where: {
      roomId: room.id,
      hidden: false,
      ...(before ? { createdAt: { lt: new Date(before) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 50),
    include: {
      author: {
        select: { id: true, username: true, image: true, profile: { select: { displayName: true } } },
      },
    },
  });

  return NextResponse.json({
    messages: messages.reverse().map((m) => ({
      id: m.id,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
      author: {
        id: m.author.id,
        username: m.author.username,
        image: m.author.image,
        displayName: m.author.profile?.displayName,
      },
    })),
  });
}

export async function POST(req: Request) {
  pruneBuckets();
  const me = await getSessionUser();
  if (!me) return unauthorized();

  // Anti-spam: 1 message / 2s burst, 20 / minute
  const burst = rateLimit(`chat:${me.id}`, { limit: 5, windowSec: 10, prefix: "chat" });
  if (!burst.allowed) return tooManyRequests("Slow down — you're sending messages too fast");
  const minute = rateLimit(`chat-min:${me.id}`, { limit: 20, windowSec: 60, prefix: "chat" });
  if (!minute.allowed) return tooManyRequests("Slow down — you're sending messages too fast");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid request body");
  }
  const parsed = chatMessageSchema.safeParse(body);
  const roomSlug =
    typeof (body as Record<string, unknown>)?.room === "string"
      ? ((body as Record<string, string>).room as string)
      : "global";
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const room = await getRoom(roomSlug);
  const message = await prisma.chatMessage.create({
    data: { roomId: room.id, authorId: me.id, content: parsed.data.content.trim() },
    include: {
      author: { select: { id: true, username: true, image: true } },
    },
  });

  notifyMentions(message.content, me.id, "/chat", `@${me.username} mentioned you in chat`);

  return NextResponse.json({ message }, { status: 201 });
}
