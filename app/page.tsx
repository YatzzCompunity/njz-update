export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp, Users, Radio } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui";
import { NewsCard, NewsCardSkeleton } from "@/components/news-card";
import { MemberCard } from "@/components/member-card";
import { CommunityPost } from "@/components/community-post";
import { LiveActivity } from "@/components/live-activity";
import { DisclaimerBanner } from "@/components/footer";
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
    <div className="space-y-12">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden rounded-3xl border border-zinc-200/60 bg-gradient-to-br from-blush-500/15 via-lav-500/15 to-transparent p-8 sm:p-12 dark:border-zinc-800">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blush-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-lav-500/20 blur-3xl" />
        <div className="relative max-w-2xl space-y-5">
          <p className="inline-flex items-center gap-2 rounded-full border border-blush-300/40 bg-white/60 px-3 py-1 text-xs font-medium text-blush-600 backdrop-blur dark:bg-zinc-900/60 dark:text-blush-300">
            <Sparkles size={13} /> The Bunnies&apos; home base
          </p>
          <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
            Everything NewJeans,{" "}
            <span className="bg-gradient-to-r from-blush-500 to-lav-500 bg-clip-text text-transparent">
              in one place.
            </span>
          </h1>
          <p className="max-w-xl text-base text-zinc-600 dark:text-zinc-400 sm:text-lg">
            Latest news, member updates, community posts, and everything Bunnies need to know.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/updates">
              <Button size="lg">
                Explore Updates <ArrowRight size={17} />
              </Button>
            </Link>
            <Link href={sessionUser ? "/community" : "/register"}>
              <Button size="lg" variant="outline">
                <Users size={17} /> Join Community
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <DisclaimerBanner />

      {/* ── Latest Updates ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Radio size={20} className="text-blush-500" /> Latest Updates
          </h2>
          <Link href="/updates" className="flex items-center gap-1 text-sm font-medium text-blush-500 hover:underline">
            View all <ArrowRight size={15} />
          </Link>
        </div>
        {latest.length === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => <NewsCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((u) => (
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

      {/* ── Trending + Live Activity ── */}
      <div className="grid gap-8 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <TrendingUp size={20} className="text-lav-400" /> Trending
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {trending.map((u, i) => (
              <div key={u.id} className="relative">
                <span className="absolute -left-1 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blush-500 to-lav-500 text-sm font-black text-white shadow-lg">
                  {i + 1}
                </span>
                <NewsCard
                  update={{
                    ...u,
                    publishedAt: u.publishedAt?.toISOString() ?? null,
                    createdAt: u.createdAt.toISOString(),
                    sourceLabel: u.source?.label,
                  }}
                />
              </div>
            ))}
          </div>
          {trending.length === 0 && (
            <p className="text-sm text-zinc-500">Trending updates will appear here once stories start coming in.</p>
          )}
        </section>
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Live Activity</h2>
          <LiveActivity />
        </section>
      </div>

      {/* ── Member Spotlight ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Member Spotlight</h2>
          <Link href="/members" className="flex items-center gap-1 text-sm font-medium text-blush-500 hover:underline">
            All members <ArrowRight size={15} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {members.map((m) => (
            <MemberCard key={m.id} member={m} />
          ))}
        </div>
      </section>

      {/* ── Community Feed ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Users size={20} className="text-blush-500" /> Community Feed
          </h2>
          <Link href="/community" className="flex items-center gap-1 text-sm font-medium text-blush-500 hover:underline">
            Join the conversation <ArrowRight size={15} />
          </Link>
        </div>
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
                _count: { comments: p._count.comments, reactions: postCounts.get(p.id) ?? 0 },
                likedByMe: likedSet.has(p.id),
                bookmarkedByMe: bookmarkedSet.has(p.id),
              }}
            />
          ))}
        </div>
        {posts.length === 0 && (
          <p className="text-sm text-zinc-500">
            No community posts yet —{" "}
            <Link href="/register" className="text-blush-500 hover:underline">be the first to post</Link>.
          </p>
        )}
      </section>
    </div>
  );
}
