// Optional dependency: only needed when Supabase Realtime env vars are set.
// Declared so TypeScript doesn't fail when the package isn't installed.
declare module "@supabase/supabase-js" {
  export function createClient(url: string, key: string): unknown;
}
