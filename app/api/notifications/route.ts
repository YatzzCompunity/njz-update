import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paginationSchema, notificationReadSchema } from "@/lib/validation";
import { getSessionUser, unauthorized, badRequest } from "@/lib/auth-helpers";

export async function GET(req: Request) {
  const me = await getSessionUser();
  if (!me) return unauthorized();

  const url = new URL(req.url);
  const parsed = paginationSchema.safeParse(Object.fromEntries(url.searchParams));
  const { page, limit } = parsed.success ? parsed.data : { page: 1, limit: 20 };
  const unreadOnly = url.searchParams.get("unread") === "true";

  const where: Record<string, unknown> = { userId: me.id };
  if (unreadOnly) where.read = false;

  const [total, unread, notifications] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: me.id, read: false } }),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    notifications: notifications.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() })),
    unread,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function PATCH(req: Request) {
  const me = await getSessionUser();
  if (!me) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid request body");
  }
  const parsed = notificationReadSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid request");

  if (parsed.data.all) {
    await prisma.notification.updateMany({
      where: { userId: me.id, read: false },
      data: { read: true },
    });
  } else if (parsed.data.ids?.length) {
    await prisma.notification.updateMany({
      where: { userId: me.id, id: { in: parsed.data.ids } },
      data: { read: true },
    });
  }
  const unread = await prisma.notification.count({ where: { userId: me.id, read: false } });
  return NextResponse.json({ ok: true, unread });
}
