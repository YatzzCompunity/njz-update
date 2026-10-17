"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ImagePlus, Link2, Send } from "lucide-react";
import { Card, Textarea, Input, Button, Skeleton, EmptyState, useToast } from "@/components/ui";
import { CommunityPost, type CommunityPostData } from "@/components/community-post";
import { POLL_INTERVALS } from "@/lib/realtime";
import { Users } from "lucide-react";

const MAX_LEN = 2000;

function Composer({ onPosted }: { onPosted: () => void }) {
  const { data: session } = useSession();
  const toast = useToast();
  const [content, setContent] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [linkUrl, setLinkUrl] = React.useState("");
  const [showMedia, setShowMedia] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function submit() {
    if (!content.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          imageUrl: imageUrl.trim() || undefined,
          linkUrl: linkUrl.trim() || undefined,
        }),
      });
      if (res.status === 429) {
        toast("Slow down — you're posting too fast", "error");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data.error ?? "Couldn't publish post", "error");
        return;
      }
      setContent("");
      setImageUrl("");
      setLinkUrl("");
      setShowMedia(false);
      toast("Posted!", "success");
      onPosted();
    } finally {
      setBusy(false);
    }
  }

  if (!session) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-zinc-500">
          <Link href="/login" className="font-medium text-blush-500 hover:underline">Sign in</Link>{" "}
          to share with the Bunnies.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind, Bunny? 🐰"
        maxLength={MAX_LEN}
        rows={3}
        aria-label="Create a post"
      />
      {showMedia && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Image URL (https://…)"
            aria-label="Image URL"
          />
          <Input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Link URL (https://…)"
            aria-label="Link URL"
          />
        </div>
      )}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => setShowMedia((s) => !s)} aria-label="Add media" title="Add image/link">
            {showMedia ? <Link2 size={18} /> : <ImagePlus size={18} />}
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs ${content.length > MAX_LEN * 0.9 ? "text-red-500" : "text-zinc-400"}`}>
            {content.length}/{MAX_LEN}
          </span>
          <Button size="sm" onClick={submit} disabled={busy || !content.trim()}>
            <Send size={15} /> {busy ? "Posting…" : "Post"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function CommunityPage() {
  const [posts, setPosts] = React.useState<CommunityPostData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loadingMore, setLoadingMore] = React.useState(false);

  const load = React.useCallback(async (pageNum: number, append: boolean, silent = false) => {
    // Loading flags are set by callers (event handlers / initial state), never
    // synchronously here, so this stays a pure async continuation.
    try {
      const res = await fetch(`/api/community/posts?page=${pageNum}&limit=15`);
      if (res.ok) {
        const data = await res.json();
        const mapped: CommunityPostData[] = (data.posts ?? []).map((p: Record<string, unknown>) => ({
          ...(p as object),
          createdAt: p.createdAt as string,
        }));
        setPosts((prev) => (append ? [...prev, ...mapped] : mapped));
        setTotalPages(data.pagination?.totalPages ?? 1);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  React.useEffect(() => {
    load(1, false);
    // Realtime-ish: refresh the first page periodically for new posts
    const t = setInterval(() => load(1, false, true), POLL_INTERVALS.communityFeed);
    return () => clearInterval(t);
  }, [load]);

  function removeFromFeed(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-black tracking-tight">
          <Users className="text-blush-500" /> Community
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          The Bunnies&apos; feed — share thoughts, hype the girls, be kind. 💗
        </p>
      </div>

      <Composer onPosted={() => { setPage(1); setLoading(true); load(1, false); }} />

      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="space-y-3 p-4">
              <div className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-24 flex-1" />
              </div>
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={<Users size={48} />}
          title="It's quiet in here…"
          description="Be the first Bunny to post something!"
        />
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <CommunityPost key={p.id} post={p} onDeleted={removeFromFeed} />
          ))}
          {page < totalPages && (
            <div className="flex justify-center">
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
        </div>
      )}
    </div>
  );
}
