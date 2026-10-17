import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const members = await prisma.member.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    include: {
      _count: { select: { updates: true } },
    },
  });
  return NextResponse.json({ members });
}
