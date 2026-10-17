import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateSchema } from "@/lib/validation";
import { requireAdmin, badRequest } from "@/lib/auth-helpers";
import { normalizeTitle, canonicalizeUrl, makeSummary } from "@/lib/ingestion/normalize";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const adminId = (admin as { id: string }).id;
  const { id } = await params;

  const existing = await prisma.newsUpdate.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Update not found" }, { status: 404 });

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

  const update = await prisma.newsUpdate.update({
    where: { id },
    data: {
      title: d.title.slice(0, 300),
      normalizedTitle: normalizeTitle(d.title),
      summary: makeSummary(d.summary, 2000),
      sourceName: d.sourceName,
      sourceUrl: canonicalizeUrl(d.sourceUrl),
      imageUrl: d.imageUrl || null,
      publishedAt: d.publishedAt ? new Date(d.publishedAt) : existing.publishedAt,
      categoryId: d.categoryId || null,
      verificationStatus: d.verificationStatus,
      status: d.status,
      members: {
        deleteMany: {},
        create: d.memberIds.map((memberId) => ({ memberId })),
      },
    },
  });

  await prisma.adminAction.create({
    data: { adminId, action: "EDIT_UPDATE", targetType: "UPDATE", targetId: id },
  });

  return NextResponse.json({ update });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const adminId = (admin as { id: string }).id;
  const { id } = await params;

  const existing = await prisma.newsUpdate.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Update not found" }, { status: 404 });

  await prisma.newsUpdate.delete({ where: { id } });
  await prisma.adminAction.create({
    data: { adminId, action: "DELETE_UPDATE", targetType: "UPDATE", targetId: id },
  });
  return NextResponse.json({ ok: true });
}
