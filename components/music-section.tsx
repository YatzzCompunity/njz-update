"use client";

import { Music2, Play } from "lucide-react";
import { useLang } from "@/lib/i18n";

// Official sources only — no rehosted audio/video.
// MV: HYBE LABELS official "New Jeans" MV (Powerpuff Girls collab)
// Audio: official NewJeans Spotify artist embed (full tracks for logged-in users)
const MV_EMBED = "https://www.youtube.com/embed/kcelgrGY1h8";
const SPOTIFY_EMBED =
  "https://open.spotify.com/embed/artist/6HvZYsbFfjnjFrWF950C9d?utm_source=generator&theme=0";

export function MusicSection() {
  const { t } = useLang();
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <img
          src="/images/bunny-logo.svg"
          alt=""
          aria-hidden
          className="sticker h-12 w-12 animate-wiggle rounded-full"
        />
        <div>
          <h2 className="font-display flex items-center gap-2 text-2xl font-extrabold">
            <Music2 size={22} className="text-blush-500" /> {t("music.title")}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("music.subtitle")}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Official MV */}
        <div className="overflow-hidden rounded-[1.4rem] border-2 border-zinc-200/70 bg-white/80 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70">
          <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
            <span className="sticker-badge text-blush-600 dark:text-blush-300">
              <Play size={12} /> {t("music.mvLabel")}
            </span>
          </div>
          <div className="aspect-video w-full">
            <iframe
              src={MV_EMBED}
              title="NewJeans (뉴진스) 'New Jeans' Official MV"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>

        {/* Spotify discography */}
        <div className="overflow-hidden rounded-[1.4rem] border-2 border-zinc-200/70 bg-white/80 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70">
          <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
            <span className="sticker-badge text-blush-600 dark:text-blush-300">
              <Music2 size={12} /> {t("music.spotifyLabel")}
            </span>
          </div>
          <iframe
            src={SPOTIFY_EMBED}
            title="NewJeans on Spotify"
            className="h-[352px] w-full"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
