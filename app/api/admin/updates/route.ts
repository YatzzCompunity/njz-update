import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateSchema, paginationSchema } from "@/lib/validation";
import { requireAdmin, badRequest } from "@/lib/auth-helpers";
import { slugify } from "@/lib/utils";
import { normalizeTitle, canonicalizeUrl, canonicalGroupKey, makeSummary } from "@/lib/ingestion/normalize";
import { verificationForLabel } from "@/lib/ingestion/classify";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const url = new URL(req.url);
  const parsed = paginationSchema.extend({
    status: z.string().optional(),
  }).safeParse(Object.fromEntries(url.searchParams));
  const { page, limit } = parsed.success ? parsed.data : { page: 1, limit: 20 };
  const status = parsed.success ? parsed.data.status : undefined;

  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;

  const [total, updates] = await Promise.all([
    prisma.newsUpdate.count({ where }),
    prisma.newsUpdate.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        category: { select: { name: true, slug: true } },
        members: { include: { member: { select: { name: true, slug: true } } } },
        source: { select: { name: true, label: true } },
      },
    }),
  ]);

  return NextResponse.json({
    updates,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const adminId = (admin as { id: string }).id;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid request body");
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const d = parsed.data;
  const canonicalUrl = canonicalizeUrl(d.sourceUrl);

  const clash = await prisma.newsUpdate.findUnique({ where: { sourceUrl: canonicalUrl } });
  if (clash) return NextResponse.json({ error: "An update with this source URL already exists" }, { status: 409 });

  const baseSlug = slugify(d.title) || `update-${Date.now()}`;
  let slug = baseSlug;
  for (let i = 1; ; i++) {
    const c = await prisma.newsUpdate.findUnique({ where: { slug } });
    if (!c) break;
    slug = `${baseSlug}-${i}`;
  }

  const update = await prisma.newsUpdate.create({
    data: {
      slug,
      title: d.title.slice(0, 300),
      normalizedTitle: normalizeTitle(d.title),
      summary: makeSummary(d.summary, 2000),
      sourceName: d.sourceName,
      sourceUrl: canonicalUrl,
      imageUrl: d.imageUrl || null,
      publishedAt: d.publishedAt ? new Date(d.publishedAt) : new Date(),
      categoryId: d.categoryId || null,
      verificationStatus: d.verificationStatus,
      status: d.status,
      canonicalGroup: canonicalGroupKey(normalizeTitle(d.title)),
      createdById: adminId,
      members: { create: d.memberIds.map((memberId) => ({ memberId })) },
    },
  });

  await prisma.adminAction.create({
    data: { adminId, action: "CREATE_UPDATE", targetType: "UPDATE", targetId: update.id },
  });

  return NextResponse.json({ update }, { status: 201 });
}
