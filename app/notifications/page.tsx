"use client";

import * as React from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button, EmptyState, Skeleton } from "@/components/ui";
import { NotificationItem, type NotificationData } from "@/components/notification-item";

export default function NotificationsPage() {
  const [items, setItems] = React.useState<NotificationData[]>([]);
  const [unread, setUnread] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<"all" | "unread">("all");

  const load = React.useCallback(async () => {
    // setLoading(true) is done by callers (filter buttons / initial state).
    try {
      const res = await fetch(`/api/notifications?unread=${filter === "unread"}&limit=30`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.notifications ?? []);
        setUnread(data.unread ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [filter]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function markAllRead() {
    const res = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    if (res.ok) {
      const data = await res.json();
      setUnread(data.unread ?? 0);
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }

  async function markOneRead(n: NotificationData) {
    if (n.read) return;
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [n.id] }),
    });
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    setUnread((u) => Math.max(0, u - 1));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-3xl font-black tracking-tight">
          <Bell className="text-blush-500" /> Notifications
          {unread > 0 && (
            <span className="rounded-full bg-blush-500 px-2.5 py-0.5 text-xs font-bold text-white">
              {unread}
            </span>
          )}
        </h1>
        {unread > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead}>
            <CheckCheck size={15} /> Mark all read
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              setLoading(true);
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-all ${
              filter === f
                ? "bg-gradient-to-r from-blush-500 to-lav-500 text-white shadow-md"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Bell size={48} />}
          title={filter === "unread" ? "All caught up!" : "No notifications yet"}
          description="Likes, replies, mentions, and new updates about the members you follow will show up here."
        />
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <div key={n.id} onClick={() => markOneRead(n)} className="cursor-pointer">
              <NotificationItem n={n} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
