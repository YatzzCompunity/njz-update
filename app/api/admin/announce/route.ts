import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, badRequest } from "@/lib/auth-helpers";
import { z } from "zod";

export const dynamic = "force-dynamic";

const announceSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().max(1000).optional(),
  link: z.string().url().max(500).optional(),
});

/** Send an admin announcement notification to every user. */
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
  const parsed = announceSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid announcement");

  const users = await prisma.user.findMany({
    where: { suspended: false },
    select: { id: true },
  });

  // Batch insert in chunks to stay friendly to the DB
  const CHUNK = 500;
  for (let i = 0; i < users.length; i += CHUNK) {
    await prisma.notification.createMany({
      data: users.slice(i, i + CHUNK).map((u) => ({
        userId: u.id,
        type: "ADMIN_ANNOUNCEMENT" as const,
        title: parsed.data.title,
        body: parsed.data.body,
        link: parsed.data.link,
      })),
    });
  }

  await prisma.adminAction.create({
    data: {
      adminId,
      action: "SEND_ANNOUNCEMENT",
      details: `${parsed.data.title} → ${users.length} users`,
    },
  });

  return NextResponse.json({ ok: true, recipients: users.length });
}
