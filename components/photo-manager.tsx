"use client";

import * as React from "react";
import { Pencil, Trash2, Plus, Eye, EyeOff, ImageIcon } from "lucide-react";
import {
  Card, Button, Input, Textarea, Badge, Skeleton, EmptyState, Modal, useToast,
} from "@/components/ui";

type Photo = {
  id: string;
  title: string;
  caption: string | null;
  imageUrl: string;
  memberId: string | null;
  credit: string;
  sourceUrl: string | null;
  published: boolean;
  order: number;
  member: { name: string; slug: string } | null;
  createdAt: string;
};

type Member = { id: string; slug: string; name: string };

const EMPTY_FORM = {
  title: "",
  caption: "",
  imageUrl: "",
  memberId: "",
  credit: "",
  sourceUrl: "",
  published: true,
  order: 0,
};

export function PhotoManager() {
  const [photos, setPhotos] = React.useState<Photo[] | null>(null);
  const [members, setMembers] = React.useState<Member[]>([]);
  const [editing, setEditing] = React.useState<Photo | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);
  const toast = useToast();

  const load = React.useCallback(() => {
    fetch("/api/admin/photos?limit=50")
      .then((r) => r.json())
      .then((d) => setPhotos(d.photos ?? []))
      .catch(() => setPhotos([]));
  }, []);

  React.useEffect(() => {
    load();
    fetch("/api/members").then((r) => r.json()).then((d) => setMembers(d.members ?? [])).catch(() => {});
  }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (p: Photo) => {
    setEditing(p);
    setForm({
      title: p.title,
      caption: p.caption ?? "",
      imageUrl: p.imageUrl,
      memberId: p.memberId ?? "",
      credit: p.credit,
      sourceUrl: p.sourceUrl ?? "",
      published: p.published,
      order: p.order,
    });
    setFormOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const url = editing ? `/api/admin/photos/${editing.id}` : "/api/admin/photos";
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save photo");
      toast(editing ? "Photo updated" : "Photo added");
      setFormOpen(false);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to save photo");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (p: Photo) => {
    const res = await fetch(`/api/admin/photos/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: p.title, caption: p.caption ?? "", imageUrl: p.imageUrl,
        memberId: p.memberId ?? "", credit: p.credit, sourceUrl: p.sourceUrl ?? "",
        published: !p.published, order: p.order,
      }),
    });
    if (res.ok) { toast(p.published ? "Unpublished" : "Published"); load(); }
    else toast("Failed to update");
  };

  const remove = async (p: Photo) => {
    if (!confirm(`Delete "${p.title}"?`)) return;
    const res = await fetch(`/api/admin/photos/${p.id}`, { method: "DELETE" });
    if (res.ok) { toast("Photo deleted"); load(); }
    else toast("Failed to delete");
  };

  const set = (k: keyof typeof EMPTY_FORM) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">Photo Manager</h2>
          <p className="text-sm text-zinc-500">
            Manage the photo gallery. Current photos use <strong>placeholders</strong> — replace them
            with licensed or official images with proper credit. Direct file upload requires
            Supabase Storage configuration (URL-based images supported for now).
          </p>
        </div>
        <Button onClick={openNew} className="shrink-0">
          <Plus size={16} /> Add photo
        </Button>
      </div>

      {!photos ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : photos.length === 0 ? (
        <EmptyState icon={<ImageIcon size={32} />} title="No photos" description="Add the first photo to the gallery." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {photos.map((p) => (
            <Card key={p.id} className="flex gap-3 p-3">
              <img
                src={p.imageUrl}
                alt={p.title}
                className="h-20 w-16 shrink-0 rounded-xl object-cover bg-zinc-100 dark:bg-zinc-800"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-bold">{p.title}</p>
                  {p.published ? (
                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">Live</Badge>
                  ) : (
                    <Badge className="bg-zinc-500/15 text-zinc-500">Hidden</Badge>
                  )}
                </div>
                <p className="truncate text-xs text-zinc-500">
                  {p.member?.name ?? "No member"} · Credit: {p.credit}
                </p>
                <div className="mt-2 flex gap-1.5">
                  <Button size="sm" variant="ghost" onClick={() => togglePublish(p)} aria-label={p.published ? "Unpublish" : "Publish"}>
                    {p.published ? <EyeOff size={14} /> : <Eye size={14} />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(p)} aria-label="Edit">
                    <Pencil size={14} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(p)} aria-label="Delete">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Edit photo" : "Add photo"}>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium">Title *</label>
            <Input value={form.title} onChange={set("title")} placeholder="Photo title" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Image URL *</label>
            <Input value={form.imageUrl} onChange={set("imageUrl")} placeholder="https://… or /images/…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium">Member</label>
              <select
                value={form.memberId}
                onChange={set("memberId")}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="">— None —</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Order</label>
              <Input
                type="number"
                value={form.order}
                onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Caption</label>
            <Textarea value={form.caption} onChange={set("caption")} placeholder="Short caption…" rows={2} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Credit * (required)</label>
            <Input value={form.credit} onChange={set("credit")} placeholder="Photographer / source name" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Source URL</label>
            <Input value={form.sourceUrl} onChange={set("sourceUrl")} placeholder="https://original-source…" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.published} onChange={set("published")} className="h-4 w-4" />
            Published (visible in gallery)
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
