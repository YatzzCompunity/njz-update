"use client";

import * as React from "react";
import { POLL_INTERVALS } from "@/lib/realtime";
import { timeAgo } from "@/lib/utils";
import { Skeleton } from "./ui";
import { Newspaper, MessageCircle, UserPlus } from "lucide-react";

interface ActivityItem {
  id: string;
  kind: "update" | "post" | "comment" | "user";
  text: string;
  at: string;
  link?: string;
}

const ICONS = { update: Newspaper, post: MessageCircle, comment: MessageCircle, user: UserPlus };

export function LiveActivity() {
  const [items, setItems] = React.useState<ActivityItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      const res = await fetch("/api/activity");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
    const t = setInterval(load, POLL_INTERVALS.liveActivity);
    return () => clearInterval(t);
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="text-sm text-zinc-500">Nothing happening yet — check back soon!</p>;
  }

  return (
    <ul className="space-y-2" aria-live="polite">
      {items.map((a) => {
        const Icon = ICONS[a.kind];
        return (
          <li
            key={a.id}
            className="flex items-start gap-3 rounded-2xl border border-zinc-200/60 bg-white/60 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900/50"
          >
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blush-500/10 text-blush-500">
              <Icon size={15} />
            </span>
            <div className="min-w-0">
              <p className="line-clamp-2">{a.text}</p>
              <p className="mt-0.5 text-xs text-zinc-400">{timeAgo(a.at)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
