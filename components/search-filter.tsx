"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "./ui";

export function SearchBar({
  initial,
  placeholder = "Search updates, members, posts…",
  autoFocus,
}: {
  initial?: string;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = React.useState(initial ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={submit} className="relative w-full" role="search">
      <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-label="Search"
        className="h-11 rounded-2xl pl-10"
      />
    </form>
  );
}

export function FilterBar<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
            value === o.value
              ? "bg-gradient-to-r from-blush-500 to-lav-500 text-white shadow-md"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
