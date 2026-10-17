"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { Send, Trash2, Flag } from "lucide-react";
import { Avatar, Input, Button, Skeleton, useToast } from "./ui";
import { timeAgo } from "@/lib/utils";
import { POLL_INTERVALS } from "@/lib/realtime";
import { ReportModal } from "./report-modal";

interface ChatMessageData {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; username: string | null; image?: string | null; displayName?: string | null };
}

export function ChatWindow({ roomSlug = "global" }: { roomSlug?: string }) {
  const { data: session } = useSession();
  const toast = useToast();
  const [messages, setMessages] = React.useState<ChatMessageData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [draft, setDraft] = React.useState("");
  const [typing, setTyping] = React.useState<string[]>([]);
  const [reportTarget, setReportTarget] = React.useState<string | null>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const me = session?.user as unknown as { id?: string } | undefined;

  const load = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/chat/messages?room=${roomSlug}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [roomSlug]);

  const loadTyping = React.useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch(`/api/chat/typing?room=${roomSlug}`);
      if (res.ok) {
        const data = await res.json();
        setTyping((data.typing ?? []).filter((u: string) => u !== (me?.id ?? "")));
      }
    } catch { /* best-effort */ }
  }, [roomSlug, session, me?.id]);

  React.useEffect(() => {
    load();
    const t = setInterval(load, POLL_INTERVALS.chat);
    return () => clearInterval(t);
  }, [load]);

  React.useEffect(() => {
    if (!session) return;
    const t = setInterval(loadTyping, 4000);
    return () => clearInterval(t);
  }, [loadTyping, session]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const typingTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  function onType(v: string) {
    setDraft(v);
    if (!session) return;
    fetch(`/api/chat/typing?room=${roomSlug}`, { method: "POST" }).catch(() => {});
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      fetch(`/api/chat/typing?room=${roomSlug}`, { method: "DELETE" }).catch(() => {});
    }, 3000);
  }

  async function send() {
    const content = draft.trim();
    if (!content) return;
    if (!session) {
      toast("Sign in to chat", "info");
      return;
    }
    setDraft("");
    const res = await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room: roomSlug, content }),
    });
    if (res.status === 429) {
      toast("Slow down — you're sending messages too fast", "error");
    } else if (!res.ok) {
      toast("Couldn't send message", "error");
    } else {
      load();
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this message?")) return;
    const res = await fetch(`/api/chat/messages/${id}`, { method: "DELETE" });
    if (res.ok) load();
    else toast("Couldn't delete message", "error");
  }

  return (
    <div className="flex h-[calc(100dvh-16rem)] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-zinc-200/70 bg-white/80 dark:border-zinc-800 dark:bg-zinc-900/70">
      <div className="flex-1 space-y-1 overflow-y-auto p-4">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-zinc-400">
            No messages yet — say hi to the Bunnies! 🐰
          </p>
        ) : (
          messages.map((m) => {
            const mine = me?.id === m.author.id;
            return (
              <div key={m.id} className={`group flex gap-2.5 py-1.5 ${mine ? "flex-row-reverse" : ""}`}>
                <Avatar src={m.author.image} name={m.author.username} size={32} />
                <div className={`max-w-[75%] ${mine ? "text-right" : ""}`}>
                  <div className="flex items-baseline gap-2">
                    {!mine && <span className="text-xs font-semibold">@{m.author.username}</span>}
                    <span className="text-[10px] text-zinc-400">{timeAgo(m.createdAt)}</span>
                  </div>
                  <div
                    className={`mt-0.5 inline-block rounded-2xl px-3.5 py-2 text-sm ${
                      mine
                        ? "rounded-tr-sm bg-gradient-to-r from-blush-500 to-lav-500 text-white"
                        : "rounded-tl-sm bg-zinc-100 dark:bg-zinc-800"
                    }`}
                  >
                    <span className="whitespace-pre-wrap break-words">{m.content}</span>
                  </div>
                  <div className={`mt-0.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 ${mine ? "justify-end" : ""}`}>
                    {mine ? (
                      <button onClick={() => remove(m.id)} className="text-zinc-400 hover:text-red-500" aria-label="Delete message">
                        <Trash2 size={13} />
                      </button>
                    ) : (
                      session && (
                        <button onClick={() => setReportTarget(m.id)} className="text-zinc-400 hover:text-red-500" aria-label="Report message">
                          <Flag size={13} />
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {typing.length > 0 && (
        <p className="px-4 pb-1 text-xs italic text-zinc-400">
          {typing.length === 1 ? "Someone is typing…" : `${typing.length} people are typing…`}
        </p>
      )}

      <div className="border-t border-zinc-200/70 p-3 dark:border-zinc-800">
        {session ? (
          <div className="flex gap-2">
            <Input
              value={draft}
              onChange={(e) => onType(e.target.value)}
              placeholder="Message Bunnies…"
              maxLength={500}
              onKeyDown={(e) => e.key === "Enter" && send()}
              aria-label="Chat message"
            />
            <Button onClick={send} size="icon" aria-label="Send message" className="shrink-0">
              <Send size={17} />
            </Button>
          </div>
        ) : (
          <p className="py-2 text-center text-sm text-zinc-500">
            <a href="/login" className="font-medium text-blush-500 hover:underline">Sign in</a> to join the chat
          </p>
        )}
      </div>

      <ReportModal
        open={!!reportTarget}
        onClose={() => setReportTarget(null)}
        targetType="CHAT_MESSAGE"
        targetId={reportTarget ?? ""}
      />
    </div>
  );
}
