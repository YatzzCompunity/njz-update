"use client";

import * as React from "react";
import Image from "next/image";
import { X, ExternalLink, Camera } from "lucide-react";
import { Skeleton, EmptyState, Badge } from "@/components/ui";
import { useLang } from "@/lib/i18n";

type Member = { id: string; slug: string; name: string };
type Photo = {
  id: string;
  title: string;
  caption: string | null;
  imageUrl: string;
  credit: string;
  sourceUrl: string | null;
  publishedAt: string | null;
  member: { name: string; slug: string } | null;
};

const FILTERS = ["all", "minji", "hanni", "danielle", "haerin", "hyein"];

export function PhotoGallery() {
  const { t } = useLang();
  const [filter, setFilter] = React.useState("all");
  const [photos, setPhotos] = React.useState<Photo[] | null>(null);
  const [members, setMembers] = React.useState<Member[]>([]);
  const [lightbox, setLightbox] = React.useState<Photo | null>(null);

  React.useEffect(() => {
    fetch("/api/members").then((r) => r.json()).then((d) => setMembers(d.members ?? [])).catch(() => {});
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhotos(null);
    fetch(`/api/photos?member=${filter}&limit=48`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setPhotos(d.photos ?? []); })
      .catch(() => { if (!cancelled) setPhotos([]); });
    return () => { cancelled = true; };
  }, [filter]);

  // Close lightbox on Escape
  React.useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setLightbox(null);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox]);

  const memberName = (slug: string) =>
    members.find((m) => m.slug === slug)?.name ?? slug;

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by member">
        {FILTERS.map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-gradient-to-r from-blush-500 to-lav-500 text-white shadow-md"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            {f === "all" ? t("photos.all") : memberName(f)}
          </button>
        ))}
      </div>

      {/* Grid */}
      {!photos ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <EmptyState
          icon={<Camera size={32} />}
          title={t("photos.noPhotos")}
          description={t("photos.noPhotosDesc")}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((p) => (
            <button
              key={p.id}
              onClick={() => setLightbox(p)}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-zinc-100 text-left transition-transform hover:scale-[1.02] dark:bg-zinc-800"
            >
              <Image
                src={p.imageUrl}
                alt={p.title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="absolute inset-x-0 bottom-0 translate-y-2 p-3 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                <p className="truncate text-sm font-bold text-white">{p.title}</p>
                {p.member && (
                  <Badge className="mt-1 bg-white/20 text-white backdrop-blur">{p.member.name}</Badge>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.title}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            onClick={() => setLightbox(null)}
            aria-label="Close"
          >
            <X size={22} />
          </button>
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[4/5] max-h-[65vh] w-full sm:aspect-[16/10]">
              <Image
                src={lightbox.imageUrl}
                alt={lightbox.title}
                fill
                sizes="90vw"
                className="object-contain"
                priority
              />
            </div>
            <div className="space-y-2 p-5">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">{lightbox.title}</h2>
                {lightbox.member && <Badge>{lightbox.member.name}</Badge>}
              </div>
              {lightbox.caption && (
                <p className="text-sm text-zinc-300">{lightbox.caption}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                <span>Credit: {lightbox.credit}</span>
                {lightbox.sourceUrl && (
                  <a
                    href={lightbox.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blush-400 hover:text-blush-300"
                  >
                    View source <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
