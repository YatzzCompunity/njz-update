import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isModeratorRole } from "@/lib/permissions";
import type { Role } from "@prisma/client";

export { isModeratorRole };
export type { Role };

export interface SessionUser {
  id: string;
  username: string | null;
  role: Role;
}

/** Current signed-in user (id/username/role) or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  const u = session?.user as unknown as
    | { id?: string; username?: string | null; role?: Role }
    | undefined;
  if (!u?.id) return null;
  // Re-check role/suspension from DB so privilege changes apply immediately
  const dbUser = await prisma.user.findUnique({
    where: { id: u.id },
    select: { id: true, username: true, role: true, suspended: true },
  });
  if (!dbUser || dbUser.suspended) return null;
  return { id: dbUser.id, username: dbUser.username, role: dbUser.role };
}

export function unauthorized(message = "Authentication required") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "You don't have permission to do that") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

export function tooManyRequests(message = "Too many requests, slow down") {
  return NextResponse.json({ error: message }, { status: 429 });
}

/** Require any signed-in user. Returns the user or a 401 response. */
export async function requireUser(): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser();
  return user ?? unauthorized();
}

/** Require MODERATOR or ADMIN. Returns the user or a 401/403 response. */
export async function requireModerator(): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (user.role !== "MODERATOR" && user.role !== "ADMIN") return forbidden();
  return user;
}

/** Require ADMIN. Returns the user or a 401/403 response. */
export async function requireAdmin(): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden("Admin access required");
  return user;
}
