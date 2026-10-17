"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Home, Newspaper, Users, MessageCircle, User, Bell, Bookmark, Search, Moon, Sun, ShieldCheck, Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, Button } from "./ui";
import { useAppTheme } from "./providers";
import { useLang } from "@/lib/i18n";
import { LangToggle } from "./lang-toggle";

const LINKS = [
  { href: "/", key: "nav.home", icon: Home },
  { href: "/updates", key: "nav.updates", icon: Newspaper },
  { href: "/photos", key: "nav.photos", icon: ImageIcon },
  { href: "/community", key: "nav.community", icon: Users },
  { href: "/chat", key: "nav.chat", icon: MessageCircle },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggle } = useAppTheme();
  const { t } = useLang();
  const user = session?.user as unknown as
    | { username?: string | null; role?: string; image?: string | null; name?: string | null }
    | undefined;

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/80 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
        <Link href="/" className="group flex items-center gap-2">
          <span className="sticker flex h-10 w-10 items-center justify-center rounded-2xl transition-transform group-hover:rotate-6">
            <img src="/images/bunny-logo.svg" alt="NJZ Update bunny logo" className="h-8 w-8" />
          </span>
          <span className="font-display hidden text-xl font-extrabold tracking-tight sm:block">
            NJZ <span className="bg-gradient-to-r from-blush-500 to-lav-500 bg-clip-text text-transparent">Update</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
                pathname === l.href && "bg-blush-500/10 text-blush-600 dark:text-blush-300"
              )}
            >
              <l.icon size={17} />
              {t(l.key)}
            </Link>
          ))}
          {(user?.role === "ADMIN" || user?.role === "MODERATOR") && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
                pathname.startsWith("/admin") && "bg-blush-500/10 text-blush-600 dark:text-blush-300"
              )}
            >
              <ShieldCheck size={17} /> {t("nav.admin")}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-1.5">
          <LangToggle className="hidden sm:flex" />
          <Link href="/search" aria-label="Search">
            <Button variant="ghost" size="icon">
              <Search size={18} />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
          {user ? (
            <>
              <Link href="/notifications" aria-label="Notifications">
                <Button variant="ghost" size="icon">
                  <Bell size={18} />
                </Button>
              </Link>
              <Link href="/bookmarks" aria-label="Bookmarks" className="hidden sm:block">
                <Button variant="ghost" size="icon">
                  <Bookmark size={18} />
                </Button>
              </Link>
              <Link href="/profile" className="ml-1">
                <Avatar src={user.image} name={user.username ?? user.name} size={34} />
              </Link>
            </>
          ) : (
            <Link href="/login">
              <Button size="sm">{t("nav.signin")}</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

const MOBILE_LINKS = [
  { href: "/", key: "nav.home", icon: Home },
  { href: "/updates", key: "nav.updates", icon: Newspaper },
  { href: "/photos", key: "nav.photos", icon: ImageIcon },
  { href: "/community", key: "nav.community", icon: Users },
  { href: "/chat", key: "nav.chat", icon: MessageCircle },
  { href: "/profile", key: "nav.profile", icon: User },
] as const;

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useLang();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200/70 bg-white/90 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/90 md:hidden"
      aria-label="Mobile"
    >
      <div className="grid grid-cols-6">
        {MOBILE_LINKS.map((l) => {
          const active = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                active ? "text-blush-500" : "text-zinc-500 dark:text-zinc-400"
              )}
            >
              <l.icon size={20} />
              {t(l.key)}
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
