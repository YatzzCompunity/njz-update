"use client";

import Link from "next/link";
import { Info } from "lucide-react";
import { useLang } from "@/lib/i18n";

export function DisclaimerBanner() {
  const { t } = useLang();
  return (
    <div className="flex items-start gap-2 rounded-2xl border border-amber-200/60 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200/90">
      <Info size={14} className="mt-0.5 shrink-0" />
      <p>{t("footer.disclaimer")}</p>
    </div>
  );
}

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="mt-16 border-t border-zinc-200/70 pb-24 dark:border-zinc-800 md:pb-8">
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="sticker flex h-9 w-9 items-center justify-center rounded-xl">
              <img src="/images/bunny-logo.svg" alt="NJZ Update bunny logo" className="h-7 w-7" />
            </span>
            <span className="font-display font-extrabold tracking-tight">NJZ Update</span>
          </div>
          <nav className="flex flex-wrap gap-4 text-sm text-zinc-500" aria-label="Footer">
            <Link href="/updates" className="hover:text-blush-500">{t("nav.updates")}</Link>
            <Link href="/members" className="hover:text-blush-500">{t("nav.members")}</Link>
            <Link href="/community" className="hover:text-blush-500">{t("nav.community")}</Link>
            <Link href="/chat" className="hover:text-blush-500">{t("nav.chat")}</Link>
          </nav>
        </div>
        <p className="max-w-3xl text-xs leading-relaxed text-zinc-400 dark:text-zinc-500">
          {t("footer.disclaimer")} {t("footer.summaries")}
        </p>
        <p className="text-xs text-zinc-400 dark:text-zinc-600">
          {t("footer.madeWith")}
        </p>
      </div>
    </footer>
  );
}
