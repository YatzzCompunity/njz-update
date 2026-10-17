import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { photoSchema, paginationSchema } from "@/lib/validation";
import { requireAdmin, badRequest } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const url = new URL(req.url);
  const parsed = paginationSchema.safeParse(Object.fromEntries(url.searchParams));
  const { page, limit } = parsed.success ? parsed.data : { page: 1, limit: 20 };

  const [total, photos] = await Promise.all([
    prisma.photo.count(),
    prisma.photo.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: { member: { select: { name: true, slug: true } } },
    }),
  ]);

  return NextResponse.json({
    photos,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid request body");
  }
  const parsed = photoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const photo = await prisma.photo.create({
    data: {
      title: d.title,
      caption: d.caption || null,
      imageUrl: d.imageUrl,
      memberId: d.memberId || null,
      credit: d.credit,
      sourceUrl: d.sourceUrl || null,
      publishedAt: d.publishedAt ? new Date(d.publishedAt) : null,
      published: d.published,
      order: d.order,
    },
    include: { member: { select: { name: true, slug: true } } },
  });

  return NextResponse.json({ photo }, { status: 201 });
}
