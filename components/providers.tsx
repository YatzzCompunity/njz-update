"use client";

import * as React from "react";
import type { Session } from "next-auth";
import { AuthProvider } from "./auth-provider";
import { ThemeProvider as NextThemeProvider, useTheme } from "./theme-context";
import { ToastProvider } from "./ui";
import { LanguageProvider } from "@/lib/i18n";

export function Providers({
  session,
  children,
}: {
  session: Session | null;
  children: React.ReactNode;
}) {
  return (
    <AuthProvider session={session}>
      <NextThemeProvider>
        <LanguageProvider>
          <ToastProvider>{children}</ToastProvider>
        </LanguageProvider>
      </NextThemeProvider>
    </AuthProvider>
  );
}

export function useAppTheme() {
  return useTheme();
}
