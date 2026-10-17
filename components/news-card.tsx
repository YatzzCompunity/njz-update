import Link from "next/link";
import { ExternalLink, Eye } from "lucide-react";
import { Card, Badge } from "./ui";
import { VerificationBadge, SourceBadge } from "./badges";
import { timeAgo, formatDate, truncate } from "@/lib/utils";

export interface NewsCardData {
  id: string;
  slug: string;
  title: string;
  summary: string;
  imageUrl?: string | null;
  sourceName: string;
  sourceLabel?: string;
  sourceUrl: string;
  publishedAt?: string | Date | null;
  createdAt: string | Date;
  verificationStatus: "VERIFIED" | "UNVERIFIED" | "PENDING";
  category?: { name: string; slug: string } | null;
  members?: Array<{ member: { name: string; slug: string } }>;
  viewCount: number;
  duplicateCount?: number;
}

export function NewsCard({ update }: { update: NewsCardData }) {
  const members = update.members ?? [];
  return (
    <Card className="group overflow-hidden">
      <Link href={`/updates/${update.slug}`} className="block">
        {update.imageUrl ? (
          <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
            <img
              src={update.imageUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-blush-500/20 via-lav-500/20 to-blush-500/10">
            <span className="bg-gradient-to-r from-blush-500 to-lav-500 bg-clip-text text-4xl font-black text-transparent">
              NJZ
            </span>
          </div>
        )}
        <div className="space-y-2.5 p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <VerificationBadge status={update.verificationStatus} />
            {update.sourceLabel && <SourceBadge label={update.sourceLabel} />}
            {update.category && <Badge variant="outline">{update.category.name}</Badge>}
          </div>
          <h3 className="line-clamp-2 text-base font-semibold leading-snug group-hover:text-blush-500">
            {update.title}
          </h3>
          <p className="line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
            {truncate(update.summary, 140)}
          </p>
          {members.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {members.map((m) => (
                <Badge key={m.member.slug} variant="pink">
                  {m.member.name}
                </Badge>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between pt-1 text-xs text-zinc-400">
            <span className="flex items-center gap-1 truncate">
              <ExternalLink size={12} className="shrink-0" />
              <span className="truncate">{update.sourceName}</span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="flex items-center gap-1">
                <Eye size={12} /> {update.viewCount}
              </span>
              <span title={update.publishedAt ? formatDate(update.publishedAt) : undefined}>
                {timeAgo(update.publishedAt ?? update.createdAt)}
              </span>
            </span>
          </div>
          {update.duplicateCount != null && update.duplicateCount > 0 && (
            <p className="text-xs font-medium text-lav-400">
              Covered by {update.duplicateCount + 1} sources
            </p>
          )}
        </div>
      </Link>
    </Card>
  );
}

export function NewsCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-video w-full animate-shimmer bg-zinc-200 dark:bg-zinc-800" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-1/3 animate-shimmer rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-5 w-full animate-shimmer rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-5 w-2/3 animate-shimmer rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </Card>
  );
}
