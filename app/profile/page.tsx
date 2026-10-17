export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-helpers";
import { reactionCounts } from "@/lib/reactions";
import { ProfileClient } from "@/components/profile-client";

export default async function ProfilePage() {
  const me = await getSessionUser();
  if (!me) redirect("/login?callbackUrl=/profile");

  const user = await prisma.user.findUnique({
    where: { id: me.id },
    include: {
      profile: true,
      _count: { select: { posts: true, comments: true, chatMessages: true } },
    },
  });
  if (!user) redirect("/login");

  const [follows, recentPosts] = await Promise.all([
    prisma.follow.findMany({ where: { userId: me.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.post.findMany({
      where: { authorId: me.id, hidden: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { _count: { select: { comments: true } } },
    }),
  ]);

  const profilePostCounts = await reactionCounts(
    "POST",
    recentPosts.map((p) => p.id)
  ).catch(() => new Map<string, number>());

  // Resolve follow target names
  const memberIds = follows.filter((f) => f.targetType === "MEMBER").map((f) => f.targetId);
  const members = memberIds.length
    ? await prisma.member.findMany({ where: { id: { in: memberIds } } })
    : [];
  const memberMap = new Map(members.map((m) => [m.id, m]));

  return (
    <ProfileClient
      user={{
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        profile: user.profile
          ? {
              displayName: user.profile.displayName,
              avatarUrl: user.profile.avatarUrl,
              bio: user.profile.bio,
              location: user.profile.location,
              website: user.profile.website,
            }
          : null,
        stats: user._count,
      }}
      follows={follows.map((f) => ({
        id: f.id,
        targetType: f.targetType,
        label:
          f.targetType === "MEMBER"
            ? memberMap.get(f.targetId)?.name ?? f.targetId
            : f.targetId,
      }))}
      recentPosts={recentPosts.map((p) => ({
        id: p.id,
        content: p.content,
        createdAt: p.createdAt.toISOString(),
        comments: p._count.comments,
        reactions: profilePostCounts.get(p.id) ?? 0,
      }))}
    />
  );
}
