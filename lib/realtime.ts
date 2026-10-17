// Realtime abstraction layer.
// - If Supabase env vars are present, `getSupabaseBrowser()` returns a client
//   and hooks can subscribe to Postgres changes on the relevant tables.
// - Otherwise every live surface falls back to short-interval polling, which
//   works on any Vercel deployment with zero extra infrastructure.
//
// Nothing here requires a persistent WebSocket server, so the app stays
// fully Vercel-serverless compatible.

export function realtimeProvider(): "supabase" | "polling" {
  if (
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return "supabase";
  }
  if (
    typeof window !== "undefined" &&
    (window as unknown as { __SUPABASE_URL__?: string }).__SUPABASE_URL__
  ) {
    return "supabase";
  }
  return "polling";
}

/** Polling defaults (ms) used when Supabase Realtime is unavailable. */
export const POLL_INTERVALS = {
  chat: 3000,
  communityFeed: 15000,
  liveActivity: 10000,
  notifications: 30000,
} as const;

/**
 * Client-side Supabase loader. Dynamically imported so the app builds and
 * runs fine without the dependency configured.
 */
export async function getSupabaseBrowser(): Promise<unknown | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const { createClient } = await import("@supabase/supabase-js").catch(() => ({
      createClient: null as never,
    }));
    if (!createClient) return null;
    return createClient(url, key);
  } catch {
    return null;
  }
}
