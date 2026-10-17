"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Heart, MessageCircle, Bookmark as BookmarkIcon, Share2, Flag, Pencil, Trash2, EyeOff } from "lucide-react";
import { Card, Avatar, Button, Badge, useToast } from "./ui";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { CommentSection } from "./comment-section";
import { ReportModal } from "./report-modal";

export interface CommunityPostData {
  id: string;
  content: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
  createdAt: string;
  hidden: boolean;
  author: { id: string; username: string | null; image?: string | null; displayName?: string | null };
  _count: { comments: number; reactions: number };
  likedByMe?: boolean;
  bookmarkedByMe?: boolean;
}

export function ReactionButton({
  targetType,
  targetId,
  initialLiked,
  initialCount,
}: {
  targetType: "POST" | "COMMENT" | "UPDATE";
  targetId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const { data: session } = useSession();
  const toast = useToast();
  const [liked, setLiked] = React.useState(initialLiked);
  const [count, setCount] = React.useState(initialCount);
  const [busy, setBusy] = React.useState(false);

  async function toggle() {
    if (!session) {
      toast("Sign in to like posts", "info");
      return;
    }
    if (busy) return;
    setBusy(true);
    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    try {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, kind: "like" }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLiked(data.liked);
      setCount(data.count);
    } catch {
      setLiked(!next);
      setCount((c) => c + (next ? -1 : 1));
      toast("Couldn't update like", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      aria-pressed={liked}
      aria-label={liked ? "Unlike" : "Like"}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition-colors",
        liked ? "text-blush-500" : "text-zinc-500 hover:text-blush-500 dark:text-zinc-400"
      )}
    >
      <Heart size={17} fill={liked ? "currentColor" : "none"} />
      <span className="text-xs font-medium">{count}</span>
    </button>
  );
}

export function BookmarkButton({
  targetType,
  targetId,
  initialBookmarked,
}: {
  targetType: "POST" | "UPDATE";
  targetId: string;
  initialBookmarked: boolean;
}) {
  const { data: session } = useSession();
  const toast = useToast();
  const [saved, setSaved] = React.useState(initialBookmarked);
  const [busy, setBusy] = React.useState(false);

  async function toggle() {
    if (!session) {
      toast("Sign in to bookmark", "info");
      return;
    }
    if (busy) return;
    setBusy(true);
    const next = !saved;
    setSaved(next);
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSaved(data.bookmarked);
      toast(data.bookmarked ? "Saved to bookmarks" : "Removed from bookmarks", "success");
    } catch {
      setSaved(!next);
      toast("Couldn't update bookmark", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      aria-pressed={saved}
      aria-label={saved ? "Remove bookmark" : "Bookmark"}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition-colors",
        saved ? "text-lav-400" : "text-zinc-500 hover:text-lav-400 dark:text-zinc-400"
      )}
    >
      <BookmarkIcon size={17} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}

export function CommunityPost({
  post,
  onDeleted,
  onHidden,
}: {
  post: CommunityPostData;
  onDeleted?: (id: string) => void;
  onHidden?: (id: string) => void;
}) {
  const { data: session } = useSession();
  const toast = useToast();
  const [showComments, setShowComments] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(post.content);
  const [reportOpen, setReportOpen] = React.useState(false);

  const me = session?.user as unknown as { id?: string; role?: string } | undefined;
  const isAuthor = me?.id === post.author.id;
  const canModerate = me?.role === "ADMIN" || me?.role === "MODERATOR";

  async function share() {
    const url = `${window.location.origin}/community#${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copied", "success");
    } catch {
      toast("Couldn't copy link", "error");
    }
  }

  async function remove() {
    if (!confirm("Delete this post?")) return;
    const res = await fetch(`/api/community/posts/${post.id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Post deleted", "success");
      onDeleted?.(post.id);
    } else {
      toast("Couldn't delete post", "error");
    }
  }

  async function hide() {
    const res = await fetch(`/api/community/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden: !post.hidden }),
    });
    if (res.ok) {
      toast(post.hidden ? "Post visible again" : "Post hidden", "success");
      onHidden?.(post.id);
    } else {
      toast("Couldn't update post", "error");
    }
  }

  async function saveEdit() {
    const res = await fetch(`/api/community/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: draft }),
    });
    if (res.ok) {
      setEditing(false);
      toast("Post updated", "success");
      window.location.reload();
    } else {
      toast("Couldn't update post", "error");
    }
  }

  return (
    <Card className="p-4" id={post.id}>
      <div className="flex items-start gap-3">
        <Avatar src={post.author.image} name={post.author.username} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">
              {post.author.displayName ?? `@${post.author.username}`}
            </span>
            <span className="shrink-0 text-xs text-zinc-400">{timeAgo(post.createdAt)}</span>
            {post.hidden && <Badge variant="amber">hidden</Badge>}
          </div>
          {editing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={2000}
                rows={3}
                className="w-full rounded-xl border border-zinc-200 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveEdit}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setDraft(post.content); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-relaxed">
              {post.content}
            </p>
          )}
          {post.imageUrl && (
            <img src={post.imageUrl} alt="" loading="lazy" className="mt-3 max-h-96 w-full rounded-xl object-cover" />
          )}
          {post.linkUrl && (
            <a
              href={post.linkUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mt-2 block truncate rounded-xl border border-zinc-200 p-2.5 text-sm text-blush-500 hover:underline dark:border-zinc-700"
            >
              🔗 {post.linkUrl}
            </a>
          )}
          <div className="mt-2 flex items-center gap-1">
            <ReactionButton
              targetType="POST"
              targetId={post.id}
              initialLiked={!!post.likedByMe}
              initialCount={post._count.reactions}
            />
            <button
              onClick={() => setShowComments((s) => !s)}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-zinc-500 hover:text-blush-500 dark:text-zinc-400"
              aria-expanded={showComments}
            >
              <MessageCircle size={17} />
              <span className="text-xs font-medium">{post._count.comments}</span>
            </button>
            <BookmarkButton targetType="POST" targetId={post.id} initialBookmarked={!!post.bookmarkedByMe} />
            <button
              onClick={share}
              className="rounded-lg px-2 py-1.5 text-zinc-500 hover:text-blush-500 dark:text-zinc-400"
              aria-label="Share post"
            >
              <Share2 size={17} />
            </button>
            <div className="ml-auto flex items-center">
              {isAuthor && (
                <>
                  <button onClick={() => setEditing(true)} className="rounded-lg px-2 py-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200" aria-label="Edit post">
                    <Pencil size={16} />
                  </button>
                  <button onClick={remove} className="rounded-lg px-2 py-1.5 text-zinc-400 hover:text-red-500" aria-label="Delete post">
                    <Trash2 size={16} />
                  </button>
                </>
              )}
              {canModerate && !isAuthor && (
                <button onClick={hide} className="rounded-lg px-2 py-1.5 text-zinc-400 hover:text-amber-500" aria-label="Hide post" title="Moderate: hide/unhide">
                  <EyeOff size={16} />
                </button>
              )}
              {!isAuthor && (
                <button onClick={() => setReportOpen(true)} className="rounded-lg px-2 py-1.5 text-zinc-400 hover:text-red-500" aria-label="Report post">
                  <Flag size={16} />
                </button>
              )}
            </div>
          </div>
          {showComments && (
            <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
              <CommentSection postId={post.id} />
            </div>
          )}
        </div>
      </div>
      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} targetType="POST" targetId={post.id} />
    </Card>
  );
}
