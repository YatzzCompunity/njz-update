"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { ErrorState } from "@/components/ui";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log to console only — never leak stack traces to the UI
    console.error("Unhandled error:", error.message);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body>
        <div className="mx-auto max-w-lg px-4 py-20">
          <ErrorState
            title="Something went wrong"
            description="We're working on it. Please try again in a moment."
            onRetry={reset}
          />
          <div className="mt-4 text-center">
            <Button variant="link" onClick={() => router.push("/")}>
              Back to home
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
