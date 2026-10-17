import { Badge } from "./ui";
import { ShieldCheck, ShieldAlert, ShieldQuestion, Building2, Newspaper, Users, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function VerificationBadge({ status }: { status: "VERIFIED" | "UNVERIFIED" | "PENDING" }) {
  if (status === "VERIFIED")
    return (
      <Badge variant="green">
        <ShieldCheck size={12} /> Verified
      </Badge>
    );
  if (status === "PENDING")
    return (
      <Badge variant="amber">
        <ShieldQuestion size={12} /> Pending review
      </Badge>
    );
  return (
    <Badge variant="red">
      <ShieldAlert size={12} /> UNVERIFIED
    </Badge>
  );
}

const SOURCE_META: Record<string, { icon: typeof Building2; variant: "lavender" | "default" | "pink" | "outline"; label: string }> = {
  OFFICIAL: { icon: Building2, variant: "lavender", label: "Official" },
  NEWS: { icon: Newspaper, variant: "default", label: "News" },
  COMMUNITY: { icon: Users, variant: "pink", label: "Community" },
  UNVERIFIED: { icon: HelpCircle, variant: "outline", label: "Unverified" },
};

export function SourceBadge({ label, className }: { label: string; className?: string }) {
  const meta = SOURCE_META[label] ?? SOURCE_META.UNVERIFIED;
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant} className={cn(className)}>
      <Icon size={12} /> {meta.label}
    </Badge>
  );
}
