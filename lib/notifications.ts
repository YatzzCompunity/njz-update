import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

/** Create a notification, silently skipping failures (never break the main flow). */
export async function notify(
  userId: string,
  type: NotificationType,
  title: string,
  opts: { body?: string; link?: string } = {}
): Promise<void> {
  try {
    await prisma.notification.create({
      data: { userId, type, title, body: opts.body, link: opts.link },
    });
  } catch {
    // notifications are best-effort
  }
}

/** Notify all followers of a member about a new published update. */
export async function notifyMemberFollowers(
  memberSlug: string,
  memberName: string,
  updateTitle: string,
  updateLink: string
): Promise<void> {
  try {
    const member = await prisma.member.findUnique({ where: { slug: memberSlug } });
    if (!member) return;
    const follows = await prisma.follow.findMany({
      where: { targetType: "MEMBER", targetId: member.id },
      select: { userId: true },
    });
    for (const f of follows) {
      await notify(f.userId, "NEW_UPDATE", `New update about ${memberName}`, {
        body: updateTitle,
        link: updateLink,
      });
    }
  } catch {
    /* best-effort */
  }
}

/** Extract @mentions from text and notify mentioned users. */
export async function notifyMentions(
  text: string,
  excludeUserId: string,
  link: string,
  context: string
): Promise<void> {
  const mentions = [...new Set([...text.matchAll(/@([a-zA-Z0-9_]{3,30})/g)].map((m) => m[1]))];
  if (!mentions.length) return;
  try {
    const users = await prisma.user.findMany({
      where: { username: { in: mentions }, id: { not: excludeUserId } },
      select: { id: true, username: true },
    });
    for (const u of users) {
      await notify(u.id, "MENTION", `@${u.username} mentioned you`, {
        body: context.slice(0, 140),
        link,
      });
    }
  } catch {
    /* best-effort */
  }
}
