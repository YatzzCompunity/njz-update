"use client";

import * as React from "react";

export type Lang = "id" | "en";

const STRINGS = {
  // ── Navbar ──
  "nav.home": { id: "Beranda", en: "Home" },
  "nav.updates": { id: "Update", en: "Updates" },
  "nav.photos": { id: "Foto", en: "Photos" },
  "nav.community": { id: "Komunitas", en: "Community" },
  "nav.chat": { id: "Chat", en: "Chat" },
  "nav.admin": { id: "Admin", en: "Admin" },
  "nav.signin": { id: "Masuk", en: "Sign in" },
  "nav.profile": { id: "Profil", en: "Profile" },
  "nav.members": { id: "Member", en: "Members" },
  // ── Hero ──
  "hero.badge": { id: "Markasnya para Bunnies", en: "The Bunnies' home base" },
  "hero.title1": { id: "Semua tentang NewJeans,", en: "Everything NewJeans," },
  "hero.title2": { id: "dalam satu tempat.", en: "in one place." },
  "hero.subtitle": {
    id: "Berita terbaru, update member, postingan komunitas, dan semua yang Bunnies perlu tahu.",
    en: "Latest news, member updates, community posts, and everything Bunnies need to know.",
  },
  "hero.explore": { id: "Jelajahi Update", en: "Explore Updates" },
  "hero.join": { id: "Gabung Komunitas", en: "Join Community" },
  // ── Homepage sections ──
  "home.latest": { id: "Update Terbaru", en: "Latest Updates" },
  "home.viewAll": { id: "Lihat semua", en: "View all" },
  "home.trending": { id: "Trending", en: "Trending" },
  "home.trendingEmpty": {
    id: "Update trending bakal muncul di sini begitu ada cerita masuk.",
    en: "Trending updates will appear here once stories start coming in.",
  },
  "home.liveActivity": { id: "Aktivitas Live", en: "Live Activity" },
  "home.spotlight": { id: "Sorotan Member", en: "Member Spotlight" },
  "home.allMembers": { id: "Semua member", en: "All members" },
  "home.communityFeed": { id: "Feed Komunitas", en: "Community Feed" },
  "home.joinConversation": { id: "Ikut ngobrol", en: "Join the conversation" },
  "home.noPosts": { id: "Belum ada postingan komunitas —", en: "No community posts yet —" },
  "home.beFirst": { id: "jadi yang pertama posting", en: "be the first to post" },
  // ── Photos ──
  "photos.title": { id: "NewJeans dalam Bingkai", en: "NewJeans in Frames" },
  "photos.subtitle": {
    id: "Foto member, potret, dan momen — semuanya dengan credit yang jelas.",
    en: "Member photos, portraits, and moments — all with proper credit.",
  },
  "photos.all": { id: "Semua", en: "All" },
  "photos.noPhotos": { id: "Belum ada foto", en: "No photos yet" },
  "photos.noPhotosDesc": {
    id: "Foto untuk member ini belum ditambahkan. Cek lagi nanti.",
    en: "Photos for this member haven't been added yet. Check back soon.",
  },
  "photos.disclaimer": {
    id: "Galeri buatan fan. Semua foto diberi credit ke sumbernya — klik foto mana pun untuk melihat atribusi. Tidak berafiliasi dengan atau didukung oleh NewJeans, ADOR, atau HYBE.",
    en: "This is a fan-made gallery. Photos are credited to their sources — click any photo for attribution. Not affiliated with or endorsed by NewJeans, ADOR, or HYBE.",
  },
  // ── Updates ──
  "updates.title": { id: "Update", en: "Updates" },
  "updates.subtitle": {
    id: "Setiap cerita NewJeans, bersumber dan bertimestamp. Item yang belum terverifikasi selalu diberi label.",
    en: "Every NewJeans story, sourced and timestamped. Unverified items are always labeled.",
  },
  "updates.searchPlaceholder": { id: "Cari update… coba “Minji”, “comeback”…", en: "Search updates… try “Minji”, “comeback”…" },
  "updates.all": { id: "Semua", en: "All" },
  "updates.latest": { id: "Terbaru", en: "Latest" },
  "updates.trending": { id: "Trending", en: "Trending" },
  "updates.noUpdates": { id: "Tidak ada update ditemukan", en: "No updates found" },
  "updates.noUpdatesDesc": {
    id: "Coba pencarian atau filter lain — cerita baru diambil setiap hari.",
    en: "Try a different search or filter — new stories are fetched daily.",
  },
  "updates.loadMore": { id: "Muat lebih banyak", en: "Load more" },
  "updates.loading": { id: "Memuat…", en: "Loading…" },
  "updates.catOfficial": { id: "Resmi", en: "Official" },
  "updates.catNews": { id: "Berita", en: "News" },
  "updates.catMusic": { id: "Musik", en: "Music" },
  "updates.catAppearance": { id: "Penampilan", en: "Appearance" },
  "updates.catSocial": { id: "Media Sosial", en: "Social Media" },
  "updates.catSchedule": { id: "Jadwal", en: "Schedule" },
  "updates.catMember": { id: "Update Member", en: "Member Updates" },
  // ── Footer / disclaimer ──
  "footer.disclaimer": {
    id: "Ini adalah platform komunitas dan agregasi berita buatan fan yang independen. Tidak berafiliasi dengan atau didukung oleh NewJeans, ADOR, HYBE, atau organisasi terkait mana pun.",
    en: "This is an independent fan-made community and news aggregation platform. It is not affiliated with or endorsed by NewJeans, ADOR, HYBE, or any related organization.",
  },
  "footer.summaries": {
    id: "Ringkasan berita adalah kutipan pendek dengan atribusi ke penerbit asli — selalu ikuti tautan sumber untuk membaca cerita lengkapnya. Item yang belum terverifikasi diberi label UNVERIFIED dan jangan dianggap sebagai fakta.",
    en: "News summaries are short excerpts with attribution to the original publisher — always follow the source link to read the full story. Unverified items are labeled UNVERIFIED and should not be treated as fact.",
  },
  "footer.madeWith": { id: "Dibuat dengan ♥ oleh Bunnies, untuk Bunnies.", en: "Made with ♥ by Bunnies, for Bunnies." },
  // ── Music ──
  "music.title": { id: "Dengerin NewJeans", en: "Listen to NewJeans" },
  "music.subtitle": {
    id: "MV resmi dan diskografi lengkap — langsung dari sumber resminya.",
    en: "Official MVs and the full discography — straight from the official sources.",
  },
  "music.mvLabel": { id: "MV Resmi: New Jeans", en: "Official MV: New Jeans" },
  "music.spotifyLabel": { id: "Diskografi di Spotify", en: "Discography on Spotify" },
  // ── Common ──
  "common.loading": { id: "Memuat...", en: "Loading..." },
} as const;

export type StringKey = keyof typeof STRINGS;

const STORAGE_KEY = "njz-lang";

const LangContext = React.createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: StringKey) => string;
}>({
  lang: "id",
  setLang: () => {},
  t: (key) => STRINGS[key].id,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "id" || saved === "en") return saved;
    } catch {
      /* ignore */
    }
    return "id";
  });

  const setLang = React.useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = l === "id" ? "id" : "en";
  }, []);

  const t = React.useCallback((key: StringKey) => STRINGS[key][lang], [lang]);

  const value = React.useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  return React.useContext(LangContext);
}
