"use client";

import { Camera } from "lucide-react";
import { PhotoGallery } from "@/components/photo-gallery";
import { useLang } from "@/lib/i18n";

export function PhotosPageContent() {
  const { t } = useLang();
  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blush-500/15 via-lav-500/10 to-transparent p-8 sm:p-12">
        <div className="pointer-events-none absolute right-8 top-8 hidden animate-float-soft sm:block" aria-hidden>
          <img src="/images/bunny-logo.svg" alt="" className="sticker h-20 w-20 rounded-full" />
        </div>
        <div className="flex items-center gap-3">
          <span className="sticker flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blush-500 to-lav-500 text-white shadow-lg">
            <Camera size={24} />
          </span>
          <div>
            <h1 className="font-display text-3xl font-black tracking-tight sm:text-4xl">
              {t("photos.title")} <span aria-hidden>🐰</span>
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {t("photos.subtitle")}
            </p>
          </div>
        </div>
      </div>

      <PhotoGallery />

      <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
        {t("photos.disclaimer")}
      </p>
    </div>
  );
}
