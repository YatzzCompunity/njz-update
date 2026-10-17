"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { Reply, Trash2, Flag } from "lucide-react";
import { Avatar, Button, Input, Skeleton, useToast } from "./ui";
import { timeAgo } from "@/lib/utils";
import { ReactionButton } from "./community-post";
import { ReportModal } from "./report-modal";

interface CommentData {
  id: string;
  content: string;
  createdAt: string;
  parentId: string | null;
  author: { id: string; username: string | null; image?: string | null; displayName?: string | null };
  _count: { reactions: number };
  likedByMe?: boolean;
  replies: CommentData[];
}

function CommentItem({
  comment,
  postId,
  depth,
  onChanged,
}: {
  comment: CommentData;
  postId: string;
  depth: number;
  onChanged: () => void;
}) {
  const { data: session } = useSession();
  const toast = useToast();
  const [replying, setReplying] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [reportOpen, setReportOpen] = React.useState(false);
  const me = session?.user as unknown as { id?: string; role?: string } | undefined;
  const isAuthor = me?.id === comment.author.id;
  const canModerate = me?.role === "ADMIN" || me?.role === "MODERATOR";

  async function sendReply() {
    if (!draft.trim()) return;
    const res = await fetch(`/api/community/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: draft.trim(), parentId: comment.id }),
    });
    if (res.ok) {
      setDraft("");
      setReplying(false);
      onChanged();
    } else if (res.status === 401) {
      toast("Sign in to reply", "info");
    } else {
      toast("Couldn't post reply", "error");
    }
  }

  async function remove() {
    if (!confirm("Delete this comment?")) return;
    const res = await fetch(`/api/community/comments/${comment.id}`, { method: "DELETE" });
    if (res.ok) {
      onChanged();
    } else {
      toast("Couldn't delete comment", "error");
    }
  }

  return (
    <div className={depth > 0 ? "ml-8 border-l-2 border-zinc-100 pl-3 dark:border-zinc-800" : ""}>
      <div className="flex items-start gap-2.5 py-2">
        <Avatar src={comment.author.image} name={comment.author.username} size={30} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold">@{comment.author.username}</span>
            <span className="text-[11px] text-zinc-400">{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="mt-0.5 whitespace-pre-wrap break-words text-sm">{comment.content}</p>
          <div className="flex items-center gap-1">
            <ReactionButton
              targetType="COMMENT"
              targetId={comment.id}
              initialLiked={!!comment.likedByMe}
              initialCount={comment._count.reactions}
            />
            {session && depth < 2 && (
              <button
                onClick={() => setReplying((r) => !r)}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-zinc-500 hover:text-blush-500"
              >
                <Reply size={14} /> Reply
              </button>
            )}
            {(isAuthor || canModerate) && (
              <button onClick={remove} className="rounded-lg px-2 py-1 text-zinc-400 hover:text-red-500" aria-label="Delete comment">
                <Trash2 size={14} />
              </button>
            )}
            {!isAuthor && session && (
              <button onClick={() => setReportOpen(true)} className="rounded-lg px-2 py-1 text-zinc-400 hover:text-red-500" aria-label="Report comment">
                <Flag size={14} />
              </button>
            )}
          </div>
          {replying && (
            <div className="mt-2 flex gap-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Reply to @${comment.author.username}…`}
                maxLength={1000}
                onKeyDown={(e) => e.key === "Enter" && sendReply()}
              />
              <Button size="sm" onClick={sendReply}>Send</Button>
            </div>
          )}
        </div>
      </div>
      {comment.replies.map((r) => (
        <CommentItem key={r.id} comment={r} postId={postId} depth={depth + 1} onChanged={onChanged} />
      ))}
      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} targetType="COMMENT" targetId={comment.id} />
    </div>
  );
}

export function CommentSection({ postId }: { postId: string }) {
  const { data: session } = useSession();
  const toast = useToast();
  const [comments, setComments] = React.useState<CommentData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [draft, setDraft] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [postId]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function send() {
    if (!draft.trim()) return;
    const res = await fetch(`/api/community/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: draft.trim() }),
    });
    if (res.ok) {
      setDraft("");
      load();
    } else if (res.status === 401) {
      toast("Sign in to comment", "info");
    } else if (res.status === 429) {
      toast("Slow down — you're commenting too fast", "error");
    } else {
      toast("Couldn't post comment", "error");
    }
  }

  return (
    <div className="space-y-1">
      {session && (
        <div className="flex gap-2 pb-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a comment…"
            maxLength={1000}
            onKeyDown={(e) => e.key === "Enter" && send()}
            aria-label="Write a comment"
          />
          <Button size="sm" onClick={send} className="shrink-0 self-center">
            Send
          </Button>
        </div>
      )}
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-5/6" />
        </div>
      ) : comments.length === 0 ? (
        <p className="py-2 text-center text-xs text-zinc-400">No comments yet — be the first!</p>
      ) : (
        comments.map((c) => <CommentItem key={c.id} comment={c} postId={postId} depth={0} onChanged={load} />)
      )}
    </div>
  );
}
