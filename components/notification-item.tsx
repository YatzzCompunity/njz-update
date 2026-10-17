"use client";

import Link from "next/link";
import { Heart, MessageCircle, AtSign, Newspaper, Megaphone, Flag } from "lucide-react";
import { timeAgo } from "@/lib/utils";

const ICONS: Record<string, typeof Heart> = {
  LIKE: Heart,
  REPLY: MessageCircle,
  MENTION: AtSign,
  NEW_UPDATE: Newspaper,
  ADMIN_ANNOUNCEMENT: Megaphone,
  REPORT_UPDATE: Flag,
};

export interface NotificationData {
  id: string;
  type: keyof typeof ICONS;
  title: string;
  body?: string | null;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

export function NotificationItem({ n }: { n: NotificationData }) {
  const Icon = ICONS[n.type] ?? Megaphone;
  const inner = (
    <div
      className={`flex gap-3 rounded-2xl border p-4 transition-colors ${
        n.read
          ? "border-zinc-200/70 bg-white/60 dark:border-zinc-800 dark:bg-zinc-900/50"
          : "border-blush-300/60 bg-blush-50/60 dark:border-blush-500/20 dark:bg-blush-500/5"
      }`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blush-400 to-lav-500 text-white">
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{n.title}</p>
        {n.body && <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500">{n.body}</p>}
        <p className="mt-1 text-xs text-zinc-400">{timeAgo(n.createdAt)}</p>
      </div>
      {!n.read && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blush-500" />}
    </div>
  );
  return n.link ? <Link href={n.link}>{inner}</Link> : inner;
}
