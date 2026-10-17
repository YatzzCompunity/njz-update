"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp, Users, Radio } from "lucide-react";
import { Button } from "@/components/ui";
import { NewsCard, NewsCardSkeleton } from "@/components/news-card";
import { MemberCard } from "@/components/member-card";
import { CommunityPost } from "@/components/community-post";
import { LiveActivity } from "@/components/live-activity";
import { DisclaimerBanner } from "@/components/footer";
import { MusicSection } from "@/components/music-section";
import { useLang } from "@/lib/i18n";

type Update = React.ComponentProps<typeof NewsCard>["update"];
type Member = React.ComponentProps<typeof MemberCard>["member"];
type Post = React.ComponentProps<typeof CommunityPost>["post"];

export function HomeContent({
  latest,
  trending,
  members,
  posts,
  sessionUser,
}: {
  latest: Update[];
  trending: Update[];
  members: Member[];
  posts: Post[];
  sessionUser: { id: string } | null;
}) {
  const { t } = useLang();

  return (
    <div className="space-y-12">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden rounded-[2rem] border border-zinc-200/60 bg-gradient-to-br from-blush-500/15 via-lav-500/15 to-transparent p-8 sm:p-12 dark:border-zinc-800">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blush-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-lav-500/20 blur-3xl" />
        {/* Floating bunny + sparkles */}
        <div className="pointer-events-none absolute right-6 top-6 hidden animate-float sm:block md:right-14" aria-hidden>
          <img src="/images/bunny-logo.svg" alt="" className="sticker h-24 w-24 rounded-full md:h-28 md:w-28" />
        </div>
        <div className="pointer-events-none absolute bottom-8 right-24 hidden animate-float-soft md:block" aria-hidden>
          <span className="text-3xl">✨</span>
        </div>
        <div className="pointer-events-none absolute right-40 top-10 hidden animate-wiggle lg:block" aria-hidden>
          <span className="text-2xl">🌸</span>
        </div>
        <div className="relative max-w-2xl space-y-5">
          <p className="sticker-badge -rotate-2 text-blush-600 dark:text-blush-300">
            <Sparkles size={13} /> {t("hero.badge")}
          </p>
          <h1 className="font-display text-4xl font-black leading-tight tracking-tight sm:text-5xl">
            {t("hero.title1")}{" "}
            <span className="squiggle bg-gradient-to-r from-blush-500 to-lav-500 bg-clip-text text-transparent">
              {t("hero.title2")}
            </span>
          </h1>
          <p className="max-w-xl text-base text-zinc-600 dark:text-zinc-400 sm:text-lg">
            {t("hero.subtitle")}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/updates">
              <Button size="lg" className="rounded-full">
                {t("hero.explore")} <ArrowRight size={17} />
              </Button>
            </Link>
            <Link href={sessionUser ? "/community" : "/register"}>
              <Button size="lg" variant="outline" className="rounded-full">
                <Users size={17} /> {t("hero.join")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <DisclaimerBanner />

      {/* ── Music ── */}
      <MusicSection />

      {/* ── Latest Updates ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display flex items-center gap-2 text-2xl font-extrabold">
            <Radio size={20} className="text-blush-500" /> {t("home.latest")}
          </h2>
          <Link href="/updates" className="flex items-center gap-1 text-sm font-medium text-blush-500 hover:underline">
            {t("home.viewAll")} <ArrowRight size={15} />
          </Link>
        </div>
        {latest.length === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => <NewsCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((u) => <NewsCard key={u.id} update={u} />)}
          </div>
        )}
      </section>

      {/* ── Trending + Live Activity ── */}
      <div className="grid gap-8 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          <h2 className="font-display flex items-center gap-2 text-2xl font-extrabold">
            <TrendingUp size={20} className="text-lav-400" /> {t("home.trending")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {trending.map((u, i) => (
              <div key={u.id} className="relative">
                <span className="absolute -left-1 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blush-500 to-lav-500 text-sm font-black text-white shadow-lg">
                  {i + 1}
                </span>
                <NewsCard update={u} />
              </div>
            ))}
          </div>
          {trending.length === 0 && (
            <p className="text-sm text-zinc-500">{t("home.trendingEmpty")}</p>
          )}
        </section>
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-extrabold">{t("home.liveActivity")}</h2>
          <LiveActivity />
        </section>
      </div>

      {/* ── Member Spotlight ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-extrabold">{t("home.spotlight")}</h2>
          <Link href="/members" className="flex items-center gap-1 text-sm font-medium text-blush-500 hover:underline">
            {t("home.allMembers")} <ArrowRight size={15} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {members.map((m) => (
            <MemberCard key={m.slug} member={m} />
          ))}
        </div>
      </section>

      {/* ── Community Feed ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display flex items-center gap-2 text-2xl font-extrabold">
            <Users size={20} className="text-blush-500" /> {t("home.communityFeed")}
          </h2>
          <Link href="/community" className="flex items-center gap-1 text-sm font-medium text-blush-500 hover:underline">
            {t("home.joinConversation")} <ArrowRight size={15} />
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {posts.map((p) => (
            <CommunityPost key={p.id} post={p} />
          ))}
        </div>
        {posts.length === 0 && (
          <p className="text-sm text-zinc-500">
            {t("home.noPosts")}{" "}
            <Link href="/register" className="text-blush-500 hover:underline">{t("home.beFirst")}</Link>.
          </p>
        )}
      </section>
    </div>
  );
}
