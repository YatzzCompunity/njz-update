"use client";

import * as React from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { LogOut, Pencil, X } from "lucide-react";
import { Card, Avatar, Button, Input, Textarea, Badge, useToast } from "./ui";
import { formatDate } from "@/lib/utils";

interface ProfileData {
  id: string;
  username: string | null;
  email: string | null;
  role: string;
  createdAt: string;
  profile: {
    displayName: string | null;
    avatarUrl: string | null;
    bio: string | null;
    location: string | null;
    website: string | null;
  } | null;
  stats: { posts: number; comments: number; chatMessages: number };
}

export function ProfileClient({
  user,
  follows,
  recentPosts,
}: {
  user: ProfileData;
  follows: Array<{ id: string; targetType: string; label: string }>;
  recentPosts: Array<{ id: string; content: string; createdAt: string; comments: number; reactions: number }>;
}) {
  const toast = useToast();
  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState({
    displayName: user.profile?.displayName ?? "",
    bio: user.profile?.bio ?? "",
    location: user.profile?.location ?? "",
    website: user.profile?.website ?? "",
    avatarUrl: user.profile?.avatarUrl ?? "",
  });
  const [busy, setBusy] = React.useState(false);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data.error ?? "Couldn't save profile", "error");
        return;
      }
      toast("Profile updated", "success");
      setEditing(false);
      window.location.reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <Avatar src={user.profile?.avatarUrl} name={user.username} size={72} />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-black">{user.profile?.displayName ?? `@${user.username}`}</h1>
            <p className="text-sm text-zinc-500">@{user.username}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge variant={user.role === "USER" ? "default" : "lavender"}>{user.role}</Badge>
              <Badge variant="outline">Joined {formatDate(user.createdAt)}</Badge>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setEditing((e) => !e)} aria-label="Edit profile">
            {editing ? <X size={18} /> : <Pencil size={18} />}
          </Button>
        </div>

        {editing ? (
          <div className="mt-5 space-y-3">
            <label className="block text-sm font-medium">
              Display name
              <Input value={form.displayName} maxLength={50} onChange={(e) => setForm({ ...form, displayName: e.target.value })} className="mt-1" />
            </label>
            <label className="block text-sm font-medium">
              Bio
              <Textarea value={form.bio} maxLength={300} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="mt-1" placeholder="Tell the Bunnies about yourself…" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Location
                <Input value={form.location} maxLength={100} onChange={(e) => setForm({ ...form, location: e.target.value })} className="mt-1" />
              </label>
              <label className="block text-sm font-medium">
                Website
                <Input value={form.website} maxLength={200} onChange={(e) => setForm({ ...form, website: e.target.value })} className="mt-1" placeholder="https://" />
              </label>
            </div>
            <label className="block text-sm font-medium">
              Avatar URL
              <Input value={form.avatarUrl} maxLength={500} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} className="mt-1" placeholder="https://…" />
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-2 text-sm">
            {user.profile?.bio && <p className="whitespace-pre-wrap">{user.profile.bio}</p>}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-zinc-500">
              {user.profile?.location && <span>📍 {user.profile.location}</span>}
              {user.profile?.website && (
                <a href={user.profile.website} target="_blank" rel="noopener noreferrer" className="text-blush-500 hover:underline">
                  🔗 {user.profile.website.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>
          </div>
        )}

        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-zinc-100 pt-4 text-center dark:border-zinc-800">
          {[
            ["Posts", user.stats.posts],
            ["Comments", user.stats.comments],
            ["Chat messages", user.stats.chatMessages],
          ].map(([label, n]) => (
            <div key={label as string}>
              <p className="text-xl font-black">{n}</p>
              <p className="text-xs text-zinc-500">{label}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-3 font-bold">Following</h2>
        {follows.length === 0 ? (
          <p className="text-sm text-zinc-500">
            You&apos;re not following anyone yet. Visit a{" "}
            <Link href="/members" className="text-blush-500 hover:underline">member page</Link> to follow your bias.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {follows.map((f) => (
              <Badge key={f.id} variant="pink">
                {f.targetType === "MEMBER" ? "🐰 " : "🏷️ "}{f.label}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Recent posts</h2>
          <Link href="/community" className="text-sm text-blush-500 hover:underline">Community</Link>
        </div>
        {recentPosts.length === 0 ? (
          <p className="text-sm text-zinc-500">No posts yet.</p>
        ) : (
          <ul className="space-y-3">
            {recentPosts.map((p) => (
              <li key={p.id} className="rounded-xl bg-zinc-50 p-3 text-sm dark:bg-zinc-800/60">
                <p className="line-clamp-2">{p.content}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  ♥ {p.reactions} · 💬 {p.comments}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Button
        variant="outline"
        className="w-full text-red-500"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        <LogOut size={16} /> Sign out
      </Button>
    </div>
  );
}
