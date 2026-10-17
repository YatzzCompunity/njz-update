import { NextResponse } from "next/server";
import { getSessionUser, unauthorized } from "@/lib/auth-helpers";

// Best-effort typing indicator, kept in memory per server instance.
// On serverless this is approximate (documented); with Supabase Realtime
// configured, the client can use broadcast channels instead.

const typing = new Map<string, Map<string, number>>(); // room -> userId -> expiresAt

function roomMap(room: string) {
  let m = typing.get(room);
  if (!m) {
    m = new Map();
    typing.set(room, m);
  }
  return m;
}

export async function GET(req: Request) {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  const room = new URL(req.url).searchParams.get("room") ?? "global";
  const now = Date.now();
  const m = roomMap(room);
  const active: string[] = [];
  for (const [userId, exp] of m) {
    if (exp > now && userId !== me.id) active.push(userId);
    else if (exp <= now) m.delete(userId);
  }
  return NextResponse.json({ typing: active });
}

export async function POST(req: Request) {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  const room = new URL(req.url).searchParams.get("room") ?? "global";
  roomMap(room).set(me.id, Date.now() + 5000);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  const room = new URL(req.url).searchParams.get("room") ?? "global";
  roomMap(room).delete(me.id);
  return NextResponse.json({ ok: true });
}
