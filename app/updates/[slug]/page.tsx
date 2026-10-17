export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Eye, ArrowLeft, CalendarDays } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, Badge, Button } from "@/components/ui";
import { VerificationBadge, SourceBadge } from "@/components/badges";
import { NewsCard } from "@/components/news-card";
import { DisclaimerBanner } from "@/components/footer";
import { FollowButton } from "@/components/follow-button";
import { BookmarkButton } from "@/components/community-post";
import { getSessionUser } from "@/lib/auth-helpers";
import { formatDate, timeAgo } from "@/lib/utils";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

async function getUpdate(slug: string) {
  const update = await prisma.newsUpdate.findFirst({
    where: { OR: [{ slug }, { id: slug }], status: "PUBLISHED" },
    include: {
      category: { select: { name: true, slug: true } },
      members: { include: { member: { select: { id: true, name: true, slug: true } } } },
      source: { select: { label: true } },
    },
  });
  return update;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const update = await getUpdate(slug).catch(() => null);
  if (!update) return { title: "Update not found" };
  const url = `${SITE_URL}/updates/${update.slug}`;
  return {
    title: update.title,
    description: update.summary.slice(0, 160),
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: update.title,
      description: update.summary.slice(0, 200),
      url,
      publishedTime: update.publishedAt?.toISOString(),
      images: update.imageUrl ? [{ url: update.imageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: update.title,
      description: update.summary.slice(0, 200),
      images: update.imageUrl ? [update.imageUrl] : undefined,
    },
  };
}

export default async function UpdateDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const update = await getUpdate(slug).catch(() => null);
  if (!update) notFound();

  const me = await getSessionUser().catch(() => null);
  const bookmarked = me
    ? !!(await prisma.bookmark
        .findUnique({
          where: { userId_targetType_targetId: { userId: me.id, targetType: "UPDATE", targetId: update.id } },
        })
        .catch(() => null))
    : false;

  // fire-and-forget view count
  prisma.newsUpdate
    .update({ where: { id: update.id }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  const coveredBy = update.canonicalGroup
    ? await prisma.newsUpdate
        .count({ where: { canonicalGroup: update.canonicalGroup, status: "PUBLISHED" } })
        .catch(() => 1)
    : 1;

  const related = await prisma.newsUpdate
    .findMany({
      where: {
        status: "PUBLISHED",
        id: { not: update.id },
        OR: [
          update.categoryId ? { categoryId: update.categoryId } : {},
          { members: { some: { memberId: { in: update.members.map((m) => m.memberId) } } } },
        ],
      },
      orderBy: { publishedAt: "desc" },
      take: 3,
      include: {
        category: { select: { name: true, slug: true } },
        members: { include: { member: { select: { name: true, slug: true } } } },
        source: { select: { label: true } },
      },
    })
    .catch(() => []);

  const memberIds = update.members.map((m) => m.memberId);
  const followedMembers = me
    ? new Set(
        (
          await prisma.follow
            .findMany({ where: { userId: me.id, targetType: "MEMBER", targetId: { in: memberIds } }, select: { targetId: true } })
            .catch(() => [])
        ).map((f) => f.targetId)
      )
    : new Set<string>();

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <Link href="/updates" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-blush-500">
        <ArrowLeft size={15} /> Back to updates
      </Link>

      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <VerificationBadge status={update.verificationStatus} />
          {update.source && <SourceBadge label={update.source.label} />}
          {update.category && (
            <Link href={`/updates?category=${update.category.slug}`}>
              <Badge variant="outline">{update.category.name}</Badge>
            </Link>
          )}
        </div>
        <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl">{update.title}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-500">
          <span className="flex items-center gap-1">
            <CalendarDays size={14} />
            {update.publishedAt ? formatDate(update.publishedAt) : "Date unknown"}
            {update.publishedAt && <span className="text-zinc-400">({timeAgo(update.publishedAt)})</span>}
          </span>
          <span className="flex items-center gap-1">
            <Eye size={14} /> {update.viewCount + 1} reads
          </span>
          {coveredBy > 1 && (
            <span className="font-medium text-lav-400">Covered by {coveredBy} sources</span>
          )}
        </div>
        {update.members.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {update.members.map(({ member }) => (
              <span key={member.slug} className="flex items-center gap-2">
                <Link href={`/members/${member.slug}`}>
                  <Badge variant="pink">{member.name}</Badge>
                </Link>
                <FollowButton
                  targetType="MEMBER"
                  targetId={member.id}
                  label={member.name}
                  initialFollowing={followedMembers.has(member.id)}
                />
              </span>
            ))}
          </div>
        )}
      </header>

      {update.imageUrl && (
        <img src={update.imageUrl} alt="" className="w-full rounded-3xl object-cover" />
      )}

      {update.verificationStatus !== "VERIFIED" && (
        <div className="rounded-2xl border border-amber-200/60 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200/90">
          <strong>{update.verificationStatus === "PENDING" ? "Pending review" : "UNVERIFIED"}</strong>{" "}
          — this item hasn&apos;t been verified by our editors. Treat it as unconfirmed and check the
          original source.
        </div>
      )}

      <Card className="p-6">
        <p className="whitespace-pre-wrap text-[17px] leading-relaxed">{update.summary}</p>
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-5 dark:border-zinc-800">
          <a href={update.sourceUrl} target="_blank" rel="noopener noreferrer nofollow">
            <Button>
              <ExternalLink size={16} /> Read full story at {update.sourceName}
            </Button>
          </a>
          <BookmarkButton targetType="UPDATE" targetId={update.id} initialBookmarked={bookmarked} />
        </div>
        <p className="mt-3 text-xs text-zinc-400">
          Fetched {timeAgo(update.fetchedAt)} · Summary only — the full article belongs to {update.sourceName}.
        </p>
      </Card>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            headline: update.title,
            description: update.summary.slice(0, 200),
            datePublished: update.publishedAt?.toISOString(),
            author: { "@type": "Organization", name: update.sourceName },
          }),
        }}
      />

      {related.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Related updates</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((u) => (
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
        </section>
      )}

      <DisclaimerBanner />
    </article>
  );
}
