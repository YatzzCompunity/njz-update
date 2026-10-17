"use client";

import * as React from "react";

type Theme = "dark" | "light";

const Ctx = React.createContext<{
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}>({ theme: "dark", toggle: () => {}, setTheme: () => {} });

export const useTheme = () => React.useContext(Ctx);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always render dark on first paint (matches <html class="dark">) to avoid
  // hydration mismatch; correct from localStorage right after mount.
  const [theme, setThemeState] = React.useState<Theme>("dark");

  React.useEffect(() => {
    const stored = localStorage.getItem("njz-theme") as Theme | null;
    if (stored === "light" || stored === "dark") {
      // Deferred so the effect body itself doesn't set state synchronously.
      queueMicrotask(() => {
        setThemeState(stored);
        document.documentElement.classList.toggle("dark", stored === "dark");
      });
    }
  }, []);

  const setTheme = React.useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem("njz-theme", t);
    document.documentElement.classList.toggle("dark", t === "dark");
  }, []);

  const toggle = React.useCallback(
    () => setTheme(theme === "dark" ? "light" : "dark"),
    [theme, setTheme]
  );

  return <Ctx.Provider value={{ theme, toggle, setTheme }}>{children}</Ctx.Provider>;
}
