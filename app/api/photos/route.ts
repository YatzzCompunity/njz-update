import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paginationSchema } from "@/lib/validation";
import { z } from "zod";

const querySchema = paginationSchema.extend({
  member: z.string().max(50).optional(),
});

const include = {
  member: { select: { name: true, slug: true } },
} as const;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
  }
  const { page, limit, member } = parsed.data;

  const where: Record<string, unknown> = { published: true };
  if (member && member !== "all") where.member = { slug: member };

  const [total, photos] = await Promise.all([
    prisma.photo.count({ where }),
    prisma.photo.findMany({
      where,
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      include,
    }),
  ]);

  return NextResponse.json({
    photos,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
