"use client";

import * as React from "react";
import type { Session } from "next-auth";
import { AuthProvider } from "./auth-provider";
import { ThemeProvider as NextThemeProvider, useTheme } from "./theme-context";
import { ToastProvider } from "./ui";

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
        <ToastProvider>{children}</ToastProvider>
      </NextThemeProvider>
    </AuthProvider>
  );
}

export function useAppTheme() {
  return useTheme();
}
