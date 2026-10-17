"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { Modal, Textarea, Button, useToast } from "./ui";

const REASONS = ["Spam", "Harassment", "Misinformation", "Inappropriate content", "Copyright", "Other"];

export function ReportModal({
  open,
  onClose,
  targetType,
  targetId,
}: {
  open: boolean;
  onClose: () => void;
  targetType: "POST" | "COMMENT" | "CHAT_MESSAGE" | "UPDATE" | "USER";
  targetId: string;
}) {
  const { data: session } = useSession();
  const toast = useToast();
  const [reason, setReason] = React.useState(REASONS[0]);
  const [details, setDetails] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function submit() {
    if (!session) {
      toast("Sign in to report", "info");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, reason, details: details || undefined }),
      });
      if (!res.ok) throw new Error();
      toast("Report submitted — moderators will review it", "success");
      onClose();
      setDetails("");
    } catch {
      toast("Couldn't submit report", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Report content">
      <div className="space-y-3">
        <label className="block text-sm font-medium">
          Reason
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Details (optional)
          <Textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={1000}
            placeholder="Add context for the moderators…"
            className="mt-1"
          />
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={submit} disabled={busy}>
            {busy ? "Submitting…" : "Submit report"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
