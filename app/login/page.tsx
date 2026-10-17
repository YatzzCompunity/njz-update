"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, Input, Button, useToast } from "@/components/ui";
import { DisclaimerBanner } from "@/components/footer";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await signIn("credentials", {
        identifier,
        password,
        redirect: false,
        callbackUrl,
      });
      if (res?.error) {
        toast("Invalid email/username or password", "error");
      } else {
        toast("Welcome back!", "success");
        router.push(res?.url ?? callbackUrl);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 py-10">
      <div className="text-center">
        <h1 className="text-3xl font-black tracking-tight">
          Welcome back,{" "}
          <span className="bg-gradient-to-r from-blush-500 to-lav-500 bg-clip-text text-transparent">
            Bunny
          </span>
        </h1>
        <p className="mt-2 text-sm text-zinc-500">Sign in to join the NewJeans community.</p>
      </div>
      <Card className="space-y-4 p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm font-medium">
            Email or username
            <Input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@example.com"
              autoComplete="username"
              required
              className="mt-1"
            />
          </label>
          <label className="block text-sm font-medium">
            Password
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="mt-1"
            />
          </label>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          or
          <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => signIn("google", { callbackUrl })}
        >
          Continue with Google
        </Button>
        <div className="flex items-center justify-between text-sm">
          <Link href="/register" className="text-blush-500 hover:underline">
            Create account
          </Link>
          <Link href="/forgot-password" className="text-zinc-500 hover:underline">
            Forgot password?
          </Link>
        </div>
      </Card>
      <DisclaimerBanner />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
