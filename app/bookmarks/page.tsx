"use client";

import * as React from "react";
import { Bookmark as BookmarkIcon } from "lucide-react";
import { Button, EmptyState, Skeleton } from "@/components/ui";
import { NewsCard } from "@/components/news-card";
import { CommunityPost } from "@/components/community-post";

export default function BookmarksPage() {
  const [items, setItems] = React.useState<Array<{ id: string; targetType: string; target: Record<string, unknown> }>>([]);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState<"all" | "UPDATE" | "POST">("all");

  const load = React.useCallback(async () => {
    // setLoading(true) is done by callers (tab buttons / initial state).
    try {
      const params = tab === "all" ? "" : `?type=${tab}`;
      const res = await fetch(`/api/bookmarks${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.bookmarks ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [tab]);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="flex items-center gap-2 text-3xl font-black tracking-tight">
        <BookmarkIcon className="text-lav-400" /> Bookmarks
      </h1>

      <div className="flex gap-2">
        {(["all", "UPDATE", "POST"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setLoading(true);
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-all ${
              tab === t
                ? "bg-gradient-to-r from-blush-500 to-lav-500 text-white shadow-md"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {t === "all" ? "All" : t === "UPDATE" ? "News" : "Posts"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<BookmarkIcon size={48} />}
          title="Nothing saved yet"
          description="Tap the bookmark icon on any update or community post to save it here."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((b) =>
            b.targetType === "UPDATE" ? (
              <NewsCard
                key={b.id}
                update={{
                  ...(b.target as object),
                  publishedAt: (b.target.publishedAt as string) ?? null,
                  createdAt: b.target.createdAt as string,
                  sourceLabel: (b.target as { source?: { label?: string } }).source?.label,
                } as Parameters<typeof NewsCard>[0]["update"]}
              />
            ) : (
              <div key={b.id} className="sm:col-span-2">
                <CommunityPost post={b.target as unknown as Parameters<typeof CommunityPost>[0]["post"]} />
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
