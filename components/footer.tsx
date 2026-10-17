import Link from "next/link";
import { Info } from "lucide-react";

export const DISCLAIMER =
  "This is an independent fan-made community and news aggregation platform. It is not affiliated with or endorsed by NewJeans, ADOR, HYBE, or any related organization.";

export function DisclaimerBanner() {
  return (
    <div className="flex items-start gap-2 rounded-2xl border border-amber-200/60 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200/90">
      <Info size={14} className="mt-0.5 shrink-0" />
      <p>{DISCLAIMER}</p>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-zinc-200/70 pb-24 dark:border-zinc-800 md:pb-8">
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blush-500 to-lav-500 text-xs font-black text-white">
              NJZ
            </span>
            <span className="font-extrabold tracking-tight">NJZ Update</span>
          </div>
          <nav className="flex flex-wrap gap-4 text-sm text-zinc-500" aria-label="Footer">
            <Link href="/updates" className="hover:text-blush-500">Updates</Link>
            <Link href="/members" className="hover:text-blush-500">Members</Link>
            <Link href="/community" className="hover:text-blush-500">Community</Link>
            <Link href="/chat" className="hover:text-blush-500">Chat</Link>
          </nav>
        </div>
        <p className="max-w-3xl text-xs leading-relaxed text-zinc-400 dark:text-zinc-500">
          {DISCLAIMER} News summaries are short excerpts with attribution to the original
          publisher — always follow the source link to read the full story. Unverified items
          are labeled <strong>UNVERIFIED</strong> and should not be treated as fact.
        </p>
        <p className="text-xs text-zinc-400 dark:text-zinc-600">
          Made with ♥ by Bunnies, for Bunnies.
        </p>
      </div>
    </footer>
  );
}
