import type { Role } from "@prisma/client";

/** Pure role helpers — no Next.js imports, safe to use in tests and edge code. */
export function isModeratorRole(role: Role): boolean {
  return role === "MODERATOR" || role === "ADMIN";
}

export function isAdminRole(role: Role): boolean {
  return role === "ADMIN";
}
