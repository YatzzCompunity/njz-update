import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { followSchema } from "@/lib/validation";
import { getSessionUser, unauthorized, badRequest } from "@/lib/auth-helpers";

export async function GET(req: Request) {
  const me = await getSessionUser();
  if (!me) return unauthorized();
  const follows = await prisma.follow.findMany({
    where: { userId: me.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ follows });
}

export async function POST(req: Request) {
  const me = await getSessionUser();
  if (!me) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid request body");
  }
  const parsed = followSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { targetType, targetId } = parsed.data;

  // Validate the target exists for MEMBER / CATEGORY
  if (targetType === "MEMBER") {
    const m = await prisma.member.findUnique({ where: { id: targetId } });
    if (!m) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  } else if (targetType === "CATEGORY") {
    const c = await prisma.category.findUnique({ where: { id: targetId } });
    if (!c) return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const existing = await prisma.follow.findUnique({
    where: { userId_targetType_targetId: { userId: me.id, targetType, targetId } },
  });

  let following: boolean;
  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
    following = false;
  } else {
    await prisma.follow.create({ data: { userId: me.id, targetType, targetId } });
    following = true;
  }
  return NextResponse.json({ following });
}
