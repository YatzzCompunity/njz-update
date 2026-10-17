import Link from "next/link";
import { Ghost } from "lucide-react";
import { Button, EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-20">
      <EmptyState
        icon={<Ghost size={48} />}
        title="404 — Page not found"
        description="This page wandered off like a lightstick at a festival. Let's get you back."
        action={
          <Link href="/">
            <Button>Back to home</Button>
          </Link>
        }
      />
    </div>
  );
}
