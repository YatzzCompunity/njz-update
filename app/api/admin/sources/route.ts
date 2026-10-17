import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sourceSchema, paginationSchema } from "@/lib/validation";
import { requireAdmin, requireModerator, badRequest } from "@/lib/auth-helpers";
import { runSource } from "@/lib/ingestion/pipeline";

export const dynamic = "force-dynamic";

// Moderators can view; only admins can mutate (checked per-method).
export async function GET(req: Request) {
  const mod = await requireModerator();
  if (mod instanceof NextResponse) return mod;

  const url = new URL(req.url);
  const parsed = paginationSchema.safeParse(Object.fromEntries(url.searchParams));
  const { page, limit } = parsed.success ? parsed.data : { page: 1, limit: 20 };

  const [total, sources] = await Promise.all([
    prisma.newsSource.count(),
    prisma.newsSource.findMany({
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { _count: { select: { updates: true, logs: true } } },
    }),
  ]);

  return NextResponse.json({
    sources,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  // ?action=fetch&id=... triggers an immediate fetch of one source
  const url = new URL(req.url);
  if (url.searchParams.get("action") === "fetch") {
    const id = url.searchParams.get("id");
    if (!id) return badRequest("Missing source id");
    const result = await runSource(id);
    return NextResponse.json({ result });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid request body");
  }
  const parsed = sourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const source = await prisma.newsSource.create({ data: parsed.data });
  return NextResponse.json({ source }, { status: 201 });
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return badRequest("Missing source id");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid request body");
  }
  const parsed = sourceSchema.partial().safeParse(body);
  if (!parsed.success) return badRequest("Invalid fields");

  const source = await prisma.newsSource.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ source });
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return badRequest("Missing source id");

  await prisma.newsSource.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
