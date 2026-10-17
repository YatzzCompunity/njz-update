"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Input, Button, useToast } from "@/components/ui";

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = React.useState({
    username: "",
    email: "",
    password: "",
    displayName: "",
  });
  const [busy, setBusy] = React.useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg =
          data.details
            ? Object.values(data.details).flat().join(", ")
            : data.error ?? "Registration failed";
        toast(String(msg), "error");
        return;
      }
      toast("Account created — signing you in…", "success");
      const login = await signIn("credentials", {
        identifier: form.email,
        password: form.password,
        redirect: false,
      });
      if (login?.error) {
        router.push("/login");
      } else {
        router.push("/");
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
          Join the{" "}
          <span className="bg-gradient-to-r from-blush-500 to-lav-500 bg-clip-text text-transparent">
            Bunnies
          </span>
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Post, chat, follow your bias, and never miss a NewJeans update.
        </p>
      </div>
      <Card className="p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm font-medium">
            Username
            <Input
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
              placeholder="bunny_hanni"
              autoComplete="username"
              required
              minLength={3}
              maxLength={30}
              className="mt-1"
            />
          </label>
          <label className="block text-sm font-medium">
            Display name <span className="font-normal text-zinc-400">(optional)</span>
            <Input
              value={form.displayName}
              onChange={(e) => set("displayName", e.target.value)}
              placeholder="Hanni's #1 fan"
              maxLength={50}
              className="mt-1"
            />
          </label>
          <label className="block text-sm font-medium">
            Email
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="mt-1"
            />
          </label>
          <label className="block text-sm font-medium">
            Password
            <Input
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
              minLength={8}
              className="mt-1"
            />
          </label>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Creating account…" : "Create account"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="text-blush-500 hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
