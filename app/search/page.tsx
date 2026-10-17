"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Search as SearchIcon } from "lucide-react";
import { SearchBar } from "@/components/search-filter";
import { NewsCard } from "@/components/news-card";
import { MemberCard } from "@/components/member-card";
import { CommunityPost } from "@/components/community-post";
import { EmptyState, Skeleton } from "@/components/ui";
import type { NewsCardData } from "@/components/news-card";

type Tab = "all" | "updates" | "members" | "community";

function SearchPage() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const [q, setQ] = React.useState(initialQ);
  const [tab, setTab] = React.useState<Tab>("all");
  const [loading, setLoading] = React.useState(!!initialQ);
  const [results, setResults] = React.useState<{
    updates: NewsCardData[];
    members: Array<{ slug: string; name: string; nickname?: string | null; bio?: string | null; imageUrl?: string | null }>;
    posts: Array<Record<string, unknown>>;
    counts: { updates: number; members: number; posts: number };
  } | null>(null);

  const run = React.useCallback(async (query: string, t: Tab) => {
    const query2 = query.trim();
    if (!query2) return;
    // setLoading(true) is done by callers (event handlers / initial state).
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query2)}&tab=${t}`);
      if (res.ok) setResults(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (initialQ) run(initialQ, "all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input = (e.target as HTMLFormElement).querySelector("input");
    const value = input?.value ?? "";
    setQ(value);
    setLoading(true);
    run(value, tab);
  }

  const tabs: Array<{ value: Tab; label: string; count?: number }> = [
    { value: "all", label: "All" },
    { value: "updates", label: "Updates", count: results?.counts.updates },
    { value: "members", label: "Members", count: results?.counts.members },
    { value: "community", label: "Community", count: results?.counts.posts },
  ];

  const showUpdates = tab === "all" || tab === "updates";
  const showMembers = tab === "all" || tab === "members";
  const showPosts = tab === "all" || tab === "community";

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <h1 className="text-3xl font-black tracking-tight">Search</h1>
      <form onSubmit={submit}>
        <SearchBar initial={initialQ} autoFocus placeholder="Try “Minji”, “Hanni”, “comeback”…" />
      </form>

      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => {
              setTab(t.value);
              setLoading(true);
              if (q.trim()) run(q, t.value);
            }}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              tab === t.value
                ? "bg-gradient-to-r from-blush-500 to-lav-500 text-white shadow-md"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {t.label}
            {t.count != null && t.count > 0 && ` (${t.count})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : !results ? (
        <EmptyState
          icon={<SearchIcon size={48} />}
          title="Search the Bunnies' universe"
          description="Find news, members, and community posts in one place."
        />
      ) : (
        <div className="space-y-8">
          {showMembers && results.members.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-bold">Members</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {results.members.map((m) => <MemberCard key={m.slug} member={m} />)}
              </div>
            </section>
          )}
          {showUpdates && results.updates.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-bold">Updates</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {results.updates.map((u) => <NewsCard key={u.id} update={u} />)}
              </div>
            </section>
          )}
          {showPosts && results.posts.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-bold">Community</h2>
              <div className="grid gap-4">
                {(results.posts as unknown as Array<Parameters<typeof CommunityPost>[0]["post"]>).map((p) => (
                  <CommunityPost key={p.id} post={p} />
                ))}
              </div>
            </section>
          )}
          {results.counts.updates === 0 && results.counts.members === 0 && results.counts.posts === 0 && (
            <EmptyState
              icon={<SearchIcon size={48} />}
              title={`No results for “${q}”`}
              description="Try a different keyword — maybe “NewJeans”, “Hanni”, or “music”."
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPageWrapper() {
  return (
    <React.Suspense fallback={null}>
      <SearchPage />
    </React.Suspense>
  );
}
