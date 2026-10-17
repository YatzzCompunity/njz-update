"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { BellPlus, BellRing } from "lucide-react";
import { Button, useToast } from "./ui";
import { cn } from "@/lib/utils";

export function FollowButton({
  targetType,
  targetId,
  label,
  initialFollowing,
}: {
  targetType: "MEMBER" | "CATEGORY" | "TOPIC";
  targetId: string;
  label: string;
  initialFollowing?: boolean;
}) {
  const { data: session } = useSession();
  const toast = useToast();
  const [following, setFollowing] = React.useState(!!initialFollowing);
  const [busy, setBusy] = React.useState(false);

  async function toggle() {
    if (!session) {
      toast("Sign in to follow", "info");
      return;
    }
    if (busy) return;
    setBusy(true);
    const next = !following;
    setFollowing(next);
    try {
      const res = await fetch("/api/follows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFollowing(data.following);
      toast(
        data.following ? `You'll get updates about ${label}` : `Unfollowed ${label}`,
        "success"
      );
    } catch {
      setFollowing(!next);
      toast("Couldn't update follow", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      variant={following ? "secondary" : "default"}
      size="sm"
      onClick={toggle}
      className={cn(following && "border border-blush-300")}
      aria-pressed={following}
    >
      {following ? <BellRing size={15} /> : <BellPlus size={15} />}
      {following ? "Following" : `Follow ${label}`}
    </Button>
  );
}
