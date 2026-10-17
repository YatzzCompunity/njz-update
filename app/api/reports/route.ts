import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reportSchema, paginationSchema } from "@/lib/validation";
import {
  getSessionUser,
  unauthorized,
  badRequest,
  requireModerator,
  tooManyRequests,
} from "@/lib/auth-helpers";
import { rateLimit, pruneBuckets } from "@/lib/rate-limit";
import { z } from "zod";

export async function GET(req: Request) {
  const mod = await requireModerator();
  if (mod instanceof NextResponse) return mod;

  const url = new URL(req.url);
  const parsed = paginationSchema.safeParse(Object.fromEntries(url.searchParams));
  const { page, limit } = parsed.success ? parsed.data : { page: 1, limit: 20 };
  const status = url.searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;

  const [total, reports] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { reporter: { select: { id: true, username: true } } },
    }),
  ]);

  return NextResponse.json({
    reports,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: Request) {
  pruneBuckets();
  const me = await getSessionUser();
  if (!me) return unauthorized();

  const rl = rateLimit(`report:${me.id}`, { limit: 10, windowSec: 3600, prefix: "reports" });
  if (!rl.allowed) return tooManyRequests("Too many reports — please slow down");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid request body");
  }
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const report = await prisma.report.create({
    data: {
      reporterId: me.id,
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      reason: parsed.data.reason,
      details: parsed.data.details,
    },
  });
  return NextResponse.json({ report }, { status: 201 });
}

const reviewSchema = z.object({
  status: z.enum(["REVIEWED", "RESOLVED", "DISMISSED"]),
});

export async function PATCH(req: Request) {
  const mod = await requireModerator();
  if (mod instanceof NextResponse) return mod;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return badRequest("Missing report id");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid request body");
  }
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid status");

  const report = await prisma.report.update({
    where: { id },
    data: { status: parsed.data.status },
  });
  await prisma.adminAction.create({
    data: {
      adminId: (mod as { id: string }).id,
      action: `REPORT_${parsed.data.status}`,
      targetType: "REPORT",
      targetId: id,
    },
  });
  return NextResponse.json({ report });
}
