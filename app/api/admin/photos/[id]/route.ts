import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { photoSchema } from "@/lib/validation";
import { requireAdmin, badRequest } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;

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

  const existing = await prisma.photo.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Photo not found" }, { status: 404 });

  const photo = await prisma.photo.update({
    where: { id },
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

  return NextResponse.json({ photo });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;

  const existing = await prisma.photo.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Photo not found" }, { status: 404 });

  await prisma.photo.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
