export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, Avatar, Badge } from "@/components/ui";
import { NewsCard } from "@/components/news-card";
import { CommunityPost } from "@/components/community-post";
import { FollowButton } from "@/components/follow-button";
import { DisclaimerBanner } from "@/components/footer";
import { getSessionUser } from "@/lib/auth-helpers";
import { reactionCounts, likedTargetIds } from "@/lib/reactions";

async function getMember(slug: string) {
  return prisma.member.findUnique({ where: { slug, active: true } });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const member = await getMember(slug).catch(() => null);
  if (!member) return { title: "Member not found" };
  return {
    title: `${member.name} — NewJeans`,
    description:
      member.bio ?? `Latest news, updates, and community posts about ${member.name} of NewJeans.`,
  };
}

export default async function MemberPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const member = await getMember(slug).catch(() => null);
  if (!member) notFound();

  const me = await getSessionUser().catch(() => null);

  const [updates, posts, following] = await Promise.all([
    prisma.newsUpdate
      .findMany({
        where: { status: "PUBLISHED", members: { some: { memberId: member.id } } },
        orderBy: { publishedAt: "desc" },
        take: 6,
        include: {
          category: { select: { name: true, slug: true } },
          members: { include: { member: { select: { name: true, slug: true } } } },
          source: { select: { label: true } },
        },
      })
      .catch(() => []),
    prisma.post
      .findMany({
        where: { hidden: false, content: { contains: member.name, mode: "insensitive" } },
        orderBy: { createdAt: "desc" },
        take: 4,
        include: {
          author: { select: { id: true, username: true, image: true, profile: { select: { displayName: true } } } },
          _count: { select: { comments: true } },
        },
      })
      .catch(() => []),
    me
      ? prisma.follow
          .findUnique({
            where: { userId_targetType_targetId: { userId: me.id, targetType: "MEMBER", targetId: member.id } },
          })
          .catch(() => null)
      : null,
  ]);

  const memberPostIds = posts.map((p) => p.id);
  const [memberPostCounts, likedPosts] = await Promise.all([
    reactionCounts("POST", memberPostIds).catch(() => new Map<string, number>()),
    likedTargetIds(me?.id, "POST", memberPostIds).catch(() => new Set<string>()),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Link href="/members" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-blush-500">
        <ArrowLeft size={15} /> All members
      </Link>

      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blush-500/30 via-lav-500/30 to-blush-500/20" />
        <div className="p-6 pt-0">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
            <Avatar src={member.imageUrl} name={member.name} size={96} className="ring-4 ring-white dark:ring-zinc-900" />
            <FollowButton
              targetType="MEMBER"
              targetId={member.id}
              label={member.name}
              initialFollowing={!!following}
            />
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight">{member.name}</h1>
          {member.nickname && member.nickname !== member.name && (
            <p className="text-zinc-500">“{member.nickname}”</p>
          )}
          {member.bio && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-300">{member.bio}</p>}
          <div className="mt-3 flex gap-2">
            <Badge variant="lavender">NewJeans</Badge>
            <Badge variant="outline">{updates.length} updates tracked</Badge>
          </div>
        </div>
      </Card>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">Latest updates</h2>
        {updates.length === 0 ? (
          <p className="text-sm text-zinc-500">No updates about {member.name} yet — check back soon.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {updates.map((u) => (
              <NewsCard
                key={u.id}
                update={{
                  ...u,
                  publishedAt: u.publishedAt?.toISOString() ?? null,
                  createdAt: u.createdAt.toISOString(),
                  sourceLabel: u.source?.label,
                }}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">Bunnies are talking</h2>
        {posts.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No community posts mention {member.name} yet.{" "}
            <Link href="/community" className="text-blush-500 hover:underline">Start the conversation</Link>.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {posts.map((p) => (
              <CommunityPost
                key={p.id}
                post={{
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
                  _count: { comments: p._count.comments, reactions: memberPostCounts.get(p.id) ?? 0 },
                  likedByMe: likedPosts.has(p.id),
                }}
              />
            ))}
          </div>
        )}
      </section>

      <DisclaimerBanner />
    </div>
  );
}
