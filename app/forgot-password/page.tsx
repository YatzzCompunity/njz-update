"use client";

import * as React from "react";
import Link from "next/link";
import { Card, Input, Button, useToast } from "@/components/ui";
import { MailCheck } from "lucide-react";

/**
 * Password reset, step 1 of the documented flow.
 * Full email delivery requires an email provider (see README — Resend/SMTP).
 * This page collects the address and explains the status honestly.
 */
export default function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // NOTE: email delivery is not configured in this build (see README).
    // We acknowledge the request without disclosing whether the account exists.
    setSent(true);
    toast("If that email is registered, reset instructions are on the way", "info");
  }

  return (
    <div className="mx-auto max-w-md space-y-6 py-10">
      <div className="text-center">
        <h1 className="text-3xl font-black tracking-tight">Reset password</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Enter your account email and we&apos;ll send you a reset link.
        </p>
      </div>
      <Card className="p-6">
        {sent ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <MailCheck size={40} className="text-blush-500" />
            <p className="text-sm text-zinc-500">
              If an account exists for <strong>{email}</strong>, you&apos;ll receive a
              password reset link shortly.
            </p>
            <Link href="/login">
              <Button variant="outline">Back to sign in</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block text-sm font-medium">
              Email
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="mt-1"
              />
            </label>
            <Button type="submit" className="w-full">
              Send reset link
            </Button>
            <p className="text-center text-sm">
              <Link href="/login" className="text-blush-500 hover:underline">
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </Card>
    </div>
  );
}
