"use client";

import * as React from "react";
import {
  LayoutDashboard, Newspaper, Rss, Flag, Users as UsersIcon, Megaphone,
  Check, X, Pencil, Trash2, RefreshCw, Power, Eye, EyeOff, BadgeCheck, ShieldAlert,
  Image as ImageIcon,
} from "lucide-react";
import { Card, Button, Input, Textarea, Badge, Skeleton, EmptyState, Modal, useToast } from "@/components/ui";
import { VerificationBadge, SourceBadge } from "@/components/badges";
import { PhotoManager } from "@/components/photo-manager";
import { timeAgo, formatDate } from "@/lib/utils";

type Tab = "overview" | "updates" | "photos" | "sources" | "reports" | "users" | "announce";

// ── Overview ──────────────────────────────────────────────────────────────

function Overview() {
  const [data, setData] = React.useState<Record<string, unknown> | null>(null);
  React.useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then(setData).catch(() => {});
  }, []);
  if (!data) {
    return <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0,1,2,3,4,5,6,7].map((i) => <Skeleton key={i} className="h-24" />)}</div>;
  }
  const o = data.overview as Record<string, number>;
  const stats: Array<[string, number, string]> = [
    ["Total users", o.totalUsers, "from-blush-500 to-blush-400"],
    ["Active (7d)", o.activeUsers, "from-lav-500 to-lav-400"],
    ["Community posts", o.totalPosts, "from-sky-500 to-sky-400"],
    ["Comments", o.totalComments, "from-emerald-500 to-emerald-400"],
    ["Published updates", o.totalUpdates, "from-amber-500 to-amber-400"],
    ["Pending review", o.pendingUpdates, "from-orange-500 to-orange-400"],
    ["Open reports", o.openReports, "from-red-500 to-red-400"],
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(([label, n, grad]) => (
          <Card key={label} className="p-5">
            <div className={`mb-2 h-1.5 w-10 rounded-full bg-gradient-to-r ${grad}`} />
            <p className="text-3xl font-black">{n}</p>
            <p className="text-sm text-zinc-500">{label}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 font-bold">Recent admin actions</h3>
          <ul className="space-y-2 text-sm">
            {(data.recentActions as Array<{ id: string; action: string; createdAt: string; admin: { username: string } }> ?? []).map((a) => (
              <li key={a.id} className="flex justify-between gap-2">
                <span><strong>@{a.admin.username}</strong> · {a.action}</span>
                <span className="shrink-0 text-zinc-400">{timeAgo(a.createdAt)}</span>
              </li>
            ))}
            {((data.recentActions as unknown[]) ?? []).length === 0 && <li className="text-zinc-500">No actions yet.</li>}
          </ul>
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 font-bold">Recent fetch runs</h3>
          <ul className="space-y-2 text-sm">
            {(data.recentLogs as Array<{ id: string; status: string; itemsInserted: number; startedAt: string; error?: string }> ?? []).map((l) => (
              <li key={l.id} className="flex justify-between gap-2">
                <span>
                  <Badge variant={l.status === "ok" ? "green" : l.status === "error" ? "red" : "amber"}>{l.status}</Badge>{" "}
                  +{l.itemsInserted} inserted
                </span>
                <span className="shrink-0 text-zinc-400">{timeAgo(l.startedAt)}</span>
              </li>
            ))}
            {((data.recentLogs as unknown[]) ?? []).length === 0 && <li className="text-zinc-500">No fetch runs yet.</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}

// ── Updates manager ───────────────────────────────────────────────────────

interface AdminUpdate {
  id: string; slug: string; title: string; summary: string;
  sourceName: string; sourceUrl: string; imageUrl?: string | null;
  publishedAt?: string | null; verificationStatus: "VERIFIED" | "UNVERIFIED" | "PENDING";
  status: string; createdAt: string;
  category?: { name: string; slug: string } | null;
  members: Array<{ member: { name: string; slug: string } }>;
  source?: { name: string; label: string } | null;
}

const EMPTY_FORM: {
  title: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  imageUrl: string;
  publishedAt: string;
  categoryId: string;
  memberIds: string[];
  verificationStatus: "VERIFIED" | "UNVERIFIED" | "PENDING";
  status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "ARCHIVED";
} = {
  title: "", summary: "", sourceName: "", sourceUrl: "", imageUrl: "",
  publishedAt: "", categoryId: "", memberIds: [],
  verificationStatus: "UNVERIFIED", status: "DRAFT",
};

function UpdateManager() {
  const toast = useToast();
  const [updates, setUpdates] = React.useState<AdminUpdate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [modal, setModal] = React.useState<null | { mode: "create" | "edit"; update?: AdminUpdate }>(null);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [categories, setCategories] = React.useState<Array<{ id: string; name: string }>>([]);
  const [members, setMembers] = React.useState<Array<{ id: string; name: string }>>([]);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    // setLoading(true) is set by callers (filter buttons / initial state).
    try {
      const params = statusFilter === "all" ? "" : `?status=${statusFilter}`;
      const res = await fetch(`/api/admin/updates${params}`);
      const data = await res.json();
      setUpdates(data.updates ?? []);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => {
    fetch("/api/admin/meta").then((r) => r.json()).then((d) => {
      setCategories(d.categories ?? []);
      setMembers(d.members ?? []);
    }).catch(() => {});
  }, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setModal({ mode: "create" });
  }
  function openEdit(u: AdminUpdate) {
    setForm({
      title: u.title,
      summary: u.summary,
      sourceName: u.sourceName,
      sourceUrl: u.sourceUrl,
      imageUrl: u.imageUrl ?? "",
      publishedAt: u.publishedAt ? new Date(u.publishedAt).toISOString().slice(0, 16) : "",
      categoryId: "",
      memberIds: [],
      verificationStatus: u.verificationStatus,
      status: u.status as typeof EMPTY_FORM.status,
    });
    setModal({ mode: "edit", update: u });
  }

  async function save() {
    setBusy(true);
    try {
      const payload = {
        ...form,
        publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : "",
      };
      const url = modal?.mode === "edit" ? `/api/admin/updates/${modal.update!.id}` : "/api/admin/updates";
      const res = await fetch(url, {
        method: modal?.mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data.error ?? "Couldn't save update", "error");
        return;
      }
      toast(modal?.mode === "edit" ? "Update saved" : "Update created", "success");
      setModal(null);
      load();
    } finally {
      setBusy(false);
    }
  }

  async function quickAction(u: AdminUpdate, patch: Partial<AdminUpdate>) {
    const res = await fetch(`/api/admin/updates/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: u.title, summary: u.summary, sourceName: u.sourceName, sourceUrl: u.sourceUrl,
        imageUrl: u.imageUrl ?? "", publishedAt: u.publishedAt ?? "",
        categoryId: "", memberIds: [],
        verificationStatus: patch.verificationStatus ?? u.verificationStatus,
        status: patch.status ?? u.status,
      }),
    });
    if (res.ok) {
      toast("Updated", "success");
      load();
    } else toast("Couldn't update", "error");
  }

  async function remove(u: AdminUpdate) {
    if (!confirm(`Delete "${u.title}"?`)) return;
    const res = await fetch(`/api/admin/updates/${u.id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Deleted", "success");
      load();
    } else toast("Couldn't delete", "error");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto">
          {["all", "PENDING_REVIEW", "PUBLISHED", "DRAFT", "ARCHIVED"].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setLoading(true); }}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${statusFilter === s ? "bg-gradient-to-r from-blush-500 to-lav-500 text-white" : "bg-zinc-100 dark:bg-zinc-800"}`}
            >
              {s === "all" ? "All" : s.replace("_", " ")}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={openCreate}>+ New update</Button>
      </div>

      {loading ? (
        <div className="space-y-2">{[0,1,2].map((i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : updates.length === 0 ? (
        <EmptyState icon={<Newspaper size={40} />} title="No updates here" description="New fetched stories appear under Pending Review (or Published if AUTO_PUBLISH=true)." />
      ) : (
        <div className="space-y-2">
          {updates.map((u) => (
            <Card key={u.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{u.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <VerificationBadge status={u.verificationStatus} />
                  <Badge variant={u.status === "PUBLISHED" ? "green" : u.status === "PENDING_REVIEW" ? "amber" : "default"}>
                    {u.status.replace("_", " ")}
                  </Badge>
                  <span className="text-xs text-zinc-400">{u.sourceName} · {timeAgo(u.createdAt)}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {u.status !== "PUBLISHED" && (
                  <Button size="sm" variant="secondary" title="Approve & publish" onClick={() => quickAction(u, { status: "PUBLISHED" })}>
                    <Check size={14} /> Publish
                  </Button>
                )}
                {u.status === "PUBLISHED" && (
                  <Button size="sm" variant="ghost" title="Unpublish" onClick={() => quickAction(u, { status: "DRAFT" })}>
                    <EyeOff size={14} />
                  </Button>
                )}
                <Button size="sm" variant="ghost" title={u.verificationStatus === "VERIFIED" ? "Mark unverified" : "Mark verified"}
                  onClick={() => quickAction(u, { verificationStatus: u.verificationStatus === "VERIFIED" ? "UNVERIFIED" : "VERIFIED" })}>
                  {u.verificationStatus === "VERIFIED" ? <ShieldAlert size={14} /> : <BadgeCheck size={14} />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => openEdit(u)} title="Edit"><Pencil size={14} /></Button>
                <Button size="sm" variant="ghost" onClick={() => remove(u)} title="Delete" className="text-red-500"><Trash2 size={14} /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === "edit" ? "Edit update" : "New update"}>
        <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
          <label className="block text-sm font-medium">Title<Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1" maxLength={300} /></label>
          <label className="block text-sm font-medium">Summary (short — never paste full articles)<Textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className="mt-1" rows={4} maxLength={2000} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium">Source name<Input value={form.sourceName} onChange={(e) => setForm({ ...form, sourceName: e.target.value })} className="mt-1" /></label>
            <label className="block text-sm font-medium">Source URL<Input value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} className="mt-1" placeholder="https://" /></label>
          </div>
          <label className="block text-sm font-medium">Image URL (optional)<Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="mt-1" placeholder="https://" /></label>
          <label className="block text-sm font-medium">Published at<Input type="datetime-local" value={form.publishedAt} onChange={(e) => setForm({ ...form, publishedAt: e.target.value })} className="mt-1" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium">Category
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="mt-1 w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900">
                <option value="">—</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium">Verification
              <select value={form.verificationStatus} onChange={(e) => setForm({ ...form, verificationStatus: e.target.value as typeof form.verificationStatus })} className="mt-1 w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900">
                <option value="VERIFIED">Verified</option>
                <option value="UNVERIFIED">Unverified</option>
                <option value="PENDING">Pending</option>
              </select>
            </label>
          </div>
          <div className="text-sm font-medium">Members
            <div className="mt-1 flex flex-wrap gap-2">
              {members.map((m) => (
                <label key={m.id} className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium ${form.memberIds.includes(m.id) ? "bg-blush-500 text-white" : "bg-zinc-100 dark:bg-zinc-800"}`}>
                  <input type="checkbox" className="hidden" checked={form.memberIds.includes(m.id)}
                    onChange={() => setForm({ ...form, memberIds: form.memberIds.includes(m.id) ? form.memberIds.filter((x) => x !== m.id) : [...form.memberIds, m.id] })} />
                  {m.name}
                </label>
              ))}
            </div>
          </div>
          <label className="block text-sm font-medium">Status
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })} className="mt-1 w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900">
              <option value="DRAFT">Draft</option>
              <option value="PENDING_REVIEW">Pending review</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={save} disabled={busy || !form.title.trim() || !form.sourceUrl.trim()}>{busy ? "Saving…" : "Save"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Source manager ────────────────────────────────────────────────────────

interface Source {
  id: string; name: string; type: string; url: string; label: string;
  enabled: boolean; fetchIntervalMin: number;
  lastFetchedAt?: string | null; lastStatus?: string | null; lastError?: string | null;
  _count: { updates: number };
}

function SourceManager() {
  const toast = useToast();
  const [sources, setSources] = React.useState<Source[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [fetching, setFetching] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    // setLoading(true) is set by callers (filter buttons / initial state).
    try {
      const res = await fetch("/api/admin/sources");
      const data = await res.json();
      setSources(data.sources ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function toggle(s: Source) {
    const res = await fetch(`/api/admin/sources?id=${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !s.enabled }),
    });
    if (res.ok) { toast(s.enabled ? "Source disabled" : "Source enabled", "success"); load(); }
  }

  async function fetchNow(s: Source) {
    setFetching(s.id);
    try {
      const res = await fetch(`/api/admin/sources?action=fetch&id=${s.id}`, { method: "POST" });
      const data = await res.json();
      toast(`Fetched ${data.result?.fetched ?? 0}, inserted ${data.result?.inserted ?? 0}`, "success");
      load();
    } catch {
      toast("Fetch failed", "error");
    } finally {
      setFetching(null);
    }
  }

  return (
    <div className="space-y-3">
      {loading ? <Skeleton className="h-32" /> : sources.map((s) => (
        <Card key={s.id} className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{s.name}</p>
                <SourceBadge label={s.label} />
                <Badge variant="outline">{s.type}</Badge>
                <Badge variant={s.lastStatus === "ok" ? "green" : s.lastStatus === "error" ? "red" : "default"}>
                  {s.lastStatus ?? "never fetched"}
                </Badge>
                {!s.enabled && <Badge variant="amber">disabled</Badge>}
              </div>
              <p className="mt-1 truncate text-xs text-zinc-400">{s.url}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {s._count.updates} updates · every {s.fetchIntervalMin} min ·
                {s.lastFetchedAt ? ` last fetch ${timeAgo(s.lastFetchedAt)}` : " never fetched"}
              </p>
              {s.lastError && <p className="mt-1 text-xs text-red-500">Error: {s.lastError}</p>}
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="secondary" onClick={() => fetchNow(s)} disabled={fetching === s.id}>
                <RefreshCw size={14} className={fetching === s.id ? "animate-spin" : ""} />
                {fetching === s.id ? "Fetching…" : "Fetch now"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => toggle(s)} title={s.enabled ? "Disable" : "Enable"}>
                <Power size={14} className={s.enabled ? "text-emerald-500" : "text-zinc-400"} />
              </Button>
            </div>
          </div>
        </Card>
      ))}
      <p className="text-xs text-zinc-400">
        Add sources via the API (<code>/api/admin/sources</code> POST) — see README for the schema.
      </p>
    </div>
  );
}

// ── Moderation ────────────────────────────────────────────────────────────

function ModerationQueue() {
  const toast = useToast();
  const [reports, setReports] = React.useState<Array<{ id: string; targetType: string; targetId: string; reason: string; details?: string; status: string; createdAt: string; reporter: { username: string } }>>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState("OPEN");

  const load = React.useCallback(async () => {
    // setLoading(true) is set by callers (filter buttons / initial state).
    try {
      const res = await fetch(`/api/reports?status=${filter}`);
      const data = await res.json();
      setReports(data.reports ?? []);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  React.useEffect(() => { load(); }, [load]);

  async function setStatus(id: string, status: string) {
    const res = await fetch(`/api/reports?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) { toast("Report updated", "success"); load(); }
    else toast("Couldn't update report", "error");
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {["OPEN", "REVIEWED", "RESOLVED", "DISMISSED"].map((s) => (
          <button key={s} onClick={() => { setFilter(s); setLoading(true); }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${filter === s ? "bg-gradient-to-r from-blush-500 to-lav-500 text-white" : "bg-zinc-100 dark:bg-zinc-800"}`}>
            {s}
          </button>
        ))}
      </div>
      {loading ? <Skeleton className="h-32" /> : reports.length === 0 ? (
        <EmptyState icon={<Flag size={40} />} title="Queue is clear" description="No reports with this status. The Bunnies are behaving. 🐰" />
      ) : reports.map((r) => (
        <Card key={r.id} className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="red">{r.reason}</Badge>
                <Badge variant="outline">{r.targetType}</Badge>
                <span className="text-xs text-zinc-400">by @{r.reporter.username} · {timeAgo(r.createdAt)}</span>
              </div>
              {r.details && <p className="mt-2 text-sm text-zinc-500">{r.details}</p>}
              <p className="mt-1 font-mono text-xs text-zinc-400">{r.targetId}</p>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="secondary" onClick={() => setStatus(r.id, "REVIEWED")}><Eye size={14} /> Review</Button>
              <Button size="sm" variant="secondary" onClick={() => setStatus(r.id, "RESOLVED")}><Check size={14} /> Resolve</Button>
              <Button size="sm" variant="ghost" onClick={() => setStatus(r.id, "DISMISSED")}><X size={14} /> Dismiss</Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ── Users ─────────────────────────────────────────────────────────────────

function UserManager() {
  const toast = useToast();
  const [users, setUsers] = React.useState<Array<{ id: string; username: string; email: string; role: string; suspended: boolean; createdAt: string; _count: { posts: number; comments: number } }>>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");

  const load = React.useCallback(async () => {
    // setLoading(true) is set by callers (filter buttons / initial state).
    try {
      const res = await fetch(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      const data = await res.json();
      setUsers(data.users ?? []);
    } finally {
      setLoading(false);
    }
  }, [q]);

  React.useEffect(() => {
    const t = setTimeout(load, 400);
    return () => clearTimeout(t);
  }, [load]);

  async function act(id: string, action: string, role?: string) {
    const res = await fetch(`/api/admin/users?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, role }),
    });
    if (res.ok) { toast("User updated", "success"); load(); }
    else toast("Couldn't update user", "error");
  }

  return (
    <div className="space-y-3">
      <Input value={q} onChange={(e) => { setQ(e.target.value); setLoading(true); }} placeholder="Search users…" className="max-w-sm" />
      {loading ? <Skeleton className="h-32" /> : users.map((u) => (
        <Card key={u.id} className="flex flex-wrap items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">@{u.username} {u.suspended && <Badge variant="red">suspended</Badge>}</p>
            <p className="text-xs text-zinc-400">{u.email} · {u._count.posts} posts · joined {formatDate(u.createdAt)}</p>
          </div>
          <select
            value={u.role}
            onChange={(e) => act(u.id, "SET_ROLE", e.target.value)}
            className="rounded-xl border border-zinc-200 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            aria-label="Set role"
          >
            <option value="USER">USER</option>
            <option value="MODERATOR">MODERATOR</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <Button size="sm" variant={u.suspended ? "secondary" : "destructive"} onClick={() => act(u.id, u.suspended ? "UNSUSPEND" : "SUSPEND")}>
            {u.suspended ? "Unsuspend" : "Suspend"}
          </Button>
        </Card>
      ))}
    </div>
  );
}

// ── Announce ──────────────────────────────────────────────────────────────

function Announce() {
  const toast = useToast();
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function send() {
    if (!title.trim()) return;
    if (!confirm("Send this announcement to ALL users?")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/announce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        toast(`Announcement sent to ${data.recipients} users`, "success");
        setTitle("");
        setBody("");
      } else toast(data.error ?? "Couldn't send", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="max-w-xl space-y-3 p-5">
      <h3 className="font-bold">Broadcast announcement</h3>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title" maxLength={200} />
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message (optional)" maxLength={1000} rows={4} />
      <Button onClick={send} disabled={busy || !title.trim()}>
        <Megaphone size={16} /> {busy ? "Sending…" : "Send to all users"}
      </Button>
    </Card>
  );
}

// ── Shell ─────────────────────────────────────────────────────────────────

const TABS: Array<{ id: Tab; label: string; icon: typeof LayoutDashboard }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "updates", label: "Updates", icon: Newspaper },
  { id: "photos", label: "Photos", icon: ImageIcon },
  { id: "sources", label: "Sources", icon: Rss },
  { id: "reports", label: "Reports", icon: Flag },
  { id: "users", label: "Users", icon: UsersIcon },
  { id: "announce", label: "Announce", icon: Megaphone },
];

export function AdminDashboard() {
  const [tab, setTab] = React.useState<Tab>("overview");
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="lg:w-56 lg:shrink-0">
        <nav className="flex gap-2 overflow-x-auto lg:sticky lg:top-20 lg:flex-col" aria-label="Admin">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-gradient-to-r from-blush-500 to-lav-500 text-white shadow-md"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              <t.icon size={17} /> {t.label}
            </button>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        {tab === "overview" && <Overview />}
        {tab === "updates" && <UpdateManager />}
        {tab === "photos" && <PhotoManager />}
        {tab === "sources" && <SourceManager />}
        {tab === "reports" && <ModerationQueue />}
        {tab === "users" && <UserManager />}
        {tab === "announce" && <Announce />}
      </div>
    </div>
  );
}
