import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireModerator } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

/** Lookup data for admin forms: categories + members. */
export async function GET() {
  const mod = await requireModerator();
  if (mod instanceof NextResponse) return mod;

  const [categories, members] = await Promise.all([
    prisma.category.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true, slug: true } }),
    prisma.member.findMany({ where: { active: true }, orderBy: { order: "asc" }, select: { id: true, name: true, slug: true } }),
  ]);
  return NextResponse.json({ categories, members });
}
