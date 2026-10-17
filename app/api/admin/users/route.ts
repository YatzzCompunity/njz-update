import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paginationSchema } from "@/lib/validation";
import { requireAdmin, badRequest } from "@/lib/auth-helpers";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const url = new URL(req.url);
  const parsed = paginationSchema.safeParse(Object.fromEntries(url.searchParams));
  const { page, limit } = parsed.success ? parsed.data : { page: 1, limit: 20 };
  const q = url.searchParams.get("q") ?? "";

  const where = q
    ? {
        OR: [
          { username: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        suspended: true,
        createdAt: true,
        _count: { select: { posts: true, comments: true } },
      },
    }),
  ]);

  return NextResponse.json({
    users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

const actionSchema = z.object({
  action: z.enum(["SET_ROLE", "SUSPEND", "UNSUSPEND"]),
  role: z.enum(["USER", "MODERATOR", "ADMIN"]).optional(),
});

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const adminId = (admin as { id: string }).id;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return badRequest("Missing user id");
  if (id === adminId) return badRequest("You can't change your own account here");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid request body");
  }
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid action");

  const { action, role } = parsed.data;
  let data: Record<string, unknown> = {};
  if (action === "SET_ROLE" && role) data = { role };
  else if (action === "SUSPEND") data = { suspended: true };
  else if (action === "UNSUSPEND") data = { suspended: false };
  else return badRequest("Invalid action");

  const user = await prisma.user.update({ where: { id }, data });
  await prisma.adminAction.create({
    data: { adminId, action: `USER_${action}`, targetType: "USER", targetId: id },
  });
  return NextResponse.json({ user: { id: user.id, role: user.role, suspended: user.suspended } });
}
