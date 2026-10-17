"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Home, Newspaper, Users, MessageCircle, User, Bell, Bookmark, Search, Moon, Sun, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, Button } from "./ui";
import { useAppTheme } from "./providers";

const LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/updates", label: "Updates", icon: Newspaper },
  { href: "/community", label: "Community", icon: Users },
  { href: "/chat", label: "Chat", icon: MessageCircle },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggle } = useAppTheme();
  const user = session?.user as unknown as
    | { username?: string | null; role?: string; image?: string | null; name?: string | null }
    | undefined;

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/80 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blush-500 to-lav-500 text-sm font-black text-white">
            NJZ
          </span>
          <span className="hidden text-lg font-extrabold tracking-tight sm:block">
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
              {l.label}
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
              <ShieldCheck size={17} /> Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-1.5">
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
              <Button size="sm">Sign in</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

const MOBILE_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/updates", label: "Updates", icon: Newspaper },
  { href: "/community", label: "Community", icon: Users },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/profile", label: "Profile", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200/70 bg-white/90 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/90 md:hidden"
      aria-label="Mobile"
    >
      <div className="grid grid-cols-5">
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
              {l.label}
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
