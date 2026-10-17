"use client";

import { useLang } from "@/lib/i18n";
import { Button } from "./ui";
import { cn } from "@/lib/utils";

export function LangToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <div
      className={cn(
        "flex items-center rounded-xl border border-zinc-200 bg-zinc-100 p-0.5 text-xs font-bold dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
      role="group"
      aria-label="Language / Bahasa"
    >
      {(["id", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={cn(
            "rounded-lg px-2 py-1 uppercase transition-colors",
            lang === l
              ? "bg-white text-blush-600 shadow-sm dark:bg-zinc-800 dark:text-blush-300"
              : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          )}
        >
          {l === "id" ? "ID" : "EN"}
        </button>
      ))}
    </div>
  );
}

// Standalone icon-style button for tight spaces (mobile nav)
export function LangToggleCompact() {
  const { lang, setLang } = useLang();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLang(lang === "id" ? "en" : "id")}
      aria-label={lang === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia"}
      className="font-bold"
    >
      {lang === "id" ? "EN" : "ID"}
    </Button>
  );
}
