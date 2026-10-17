"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Newspaper, Search } from "lucide-react";
import { NewsCard, NewsCardSkeleton } from "@/components/news-card";
import { FilterBar } from "@/components/search-filter";
import { EmptyState, Button, Input } from "@/components/ui";
import type { NewsCardData } from "@/components/news-card";

const MEMBER_FILTERS = ["all", "minji", "hanni", "danielle", "haerin", "hyein"] as const;
const CATEGORY_FILTERS = [
  { value: "all", label: "All" },
  { value: "official", label: "Official" },
  { value: "news", label: "News" },
  { value: "music", label: "Music" },
  { value: "appearance", label: "Appearance" },
  { value: "social-media", label: "Social Media" },
  { value: "schedule", label: "Schedule" },
  { value: "member-updates", label: "Member Updates" },
];

function UpdatesPage() {
  const searchParams = useSearchParams();
  const [member, setMember] = React.useState<string>(searchParams.get("member") ?? "all");
  const [category, setCategory] = React.useState("all");
  const [sort, setSort] = React.useState<"latest" | "trending">("latest");
  const [q, setQ] = React.useState("");
  const [updates, setUpdates] = React.useState<NewsCardData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loadingMore, setLoadingMore] = React.useState(false);

  const load = React.useCallback(
    async (pageNum: number, append: boolean) => {
      // Loading flags are set by callers (event handlers), never synchronously
      // here, so this stays a pure async continuation.
      try {
        const params = new URLSearchParams({
          page: String(pageNum),
          limit: "12",
          sort,
        });
        if (member !== "all") params.set("member", member);
        if (category !== "all") params.set("category", category);
        if (q.trim()) params.set("q", q.trim());
        const res = await fetch(`/api/updates?${params}`);
        const data = await res.json();
        setUpdates((prev) => (append ? [...prev, ...(data.updates ?? [])] : data.updates ?? []));
        setTotalPages(data.pagination?.totalPages ?? 1);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [member, category, sort, q]
  );

  React.useEffect(() => {
    load(1, false);
  }, [load]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setLoading(true);
    load(1, false);
  }

  function changeFilter(setter: (v: string) => void) {
    return (v: string) => {
      setter(v);
      setPage(1);
      setLoading(true);
    };
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Updates</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Every NewJeans story, sourced and timestamped. Unverified items are always labeled.
        </p>
      </div>

      <form onSubmit={submitSearch} className="relative" role="search">
        <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search updates… try “Minji”, “comeback”…"
          aria-label="Search updates"
          className="h-11 rounded-2xl pl-10"
        />
      </form>

      <div className="space-y-2">
        <FilterBar
          ariaLabel="Filter by member"
          options={MEMBER_FILTERS.map((m) => ({
            value: m,
            label: m === "all" ? "All" : m.charAt(0).toUpperCase() + m.slice(1),
          }))}
          value={member}
          onChange={changeFilter(setMember)}
        />
        <FilterBar ariaLabel="Filter by category" options={CATEGORY_FILTERS} value={category} onChange={changeFilter(setCategory)} />
        <FilterBar
          ariaLabel="Sort"
          options={[
            { value: "latest", label: "Latest" },
            { value: "trending", label: "Trending" },
          ]}
          value={sort}
          onChange={changeFilter((v) => setSort(v as "latest" | "trending"))}
        />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => <NewsCardSkeleton key={i} />)}
        </div>
      ) : updates.length === 0 ? (
        <EmptyState
          icon={<Newspaper size={48} />}
          title="No updates found"
          description="Try a different search or filter — new stories are fetched every 15 minutes."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {updates.map((u) => (
              <NewsCard key={u.id} update={u} />
            ))}
          </div>
          {page < totalPages && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                disabled={loadingMore}
                onClick={() => {
                  const next = page + 1;
                  setPage(next);
                  setLoadingMore(true);
                  load(next, true);
                }}
              >
                {loadingMore ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function UpdatesPageWrapper() {
  return (
    <React.Suspense fallback={null}>
      <UpdatesPage />
    </React.Suspense>
  );
}
