import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paginationSchema } from "@/lib/validation";
import { z } from "zod";

const querySchema = paginationSchema.extend({
  category: z.string().max(50).optional(),
  member: z.string().max(50).optional(),
  q: z.string().max(100).optional(),
  sort: z.enum(["latest", "trending"]).default("latest"),
});

const include = {
  category: { select: { name: true, slug: true } },
  members: { include: { member: { select: { name: true, slug: true } } } },
  source: { select: { label: true } },
} as const;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
  }
  const { page, limit, category, member, q, sort } = parsed.data;

  const where: Record<string, unknown> = { status: "PUBLISHED" };
  if (category && category !== "all") where.category = { slug: category };
  if (member && member !== "all") where.members = { some: { member: { slug: member } } };
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { summary: { contains: q, mode: "insensitive" } },
    ];
  }

  const orderBy =
    sort === "trending" ? { viewCount: "desc" as const } : { publishedAt: "desc" as const };

  const [total, updates] = await Promise.all([
    prisma.newsUpdate.count({ where }),
    prisma.newsUpdate.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include,
    }),
  ]);

  // "Covered by N sources": count siblings in the same canonical group
  const groups = [...new Set(updates.map((u) => u.canonicalGroup).filter(Boolean))];
  const groupCounts = new Map<string, number>();
  if (groups.length) {
    const siblings = await prisma.newsUpdate.groupBy({
      by: ["canonicalGroup"],
      where: { canonicalGroup: { in: groups as string[] }, status: "PUBLISHED" },
      _count: true,
    });
    for (const s of siblings) {
      if (s.canonicalGroup) groupCounts.set(s.canonicalGroup, s._count);
    }
  }

  return NextResponse.json({
    updates: updates.map((u) => ({
      ...u,
      sourceLabel: u.source?.label,
      duplicateCount: u.canonicalGroup ? (groupCounts.get(u.canonicalGroup) ?? 1) - 1 : 0,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
