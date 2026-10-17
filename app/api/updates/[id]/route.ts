import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const update = await prisma.newsUpdate.findFirst({
    where: { OR: [{ id }, { slug: id }], status: "PUBLISHED" },
    include: {
      category: { select: { name: true, slug: true } },
      members: { include: { member: { select: { name: true, slug: true, imageUrl: true } } } },
      source: { select: { label: true } },
    },
  });
  if (!update) {
    return NextResponse.json({ error: "Update not found" }, { status: 404 });
  }

  // Increment view count (fire-and-forget)
  prisma.newsUpdate
    .update({ where: { id: update.id }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  const coveredBy = update.canonicalGroup
    ? await prisma.newsUpdate.count({
        where: { canonicalGroup: update.canonicalGroup, status: "PUBLISHED" },
      })
    : 1;

  const related = await prisma.newsUpdate.findMany({
    where: {
      status: "PUBLISHED",
      id: { not: update.id },
      OR: [
        { categoryId: update.categoryId },
        { members: { some: { memberId: { in: update.members.map((m) => m.memberId) } } } },
      ],
    },
    orderBy: { publishedAt: "desc" },
    take: 4,
    select: { id: true, slug: true, title: true, imageUrl: true, publishedAt: true },
  });

  return NextResponse.json({
    update: { ...update, sourceLabel: update.source?.label, coveredBy },
    related,
  });
}
