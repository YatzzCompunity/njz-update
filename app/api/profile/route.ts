import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validation";
import { getSessionUser, unauthorized, badRequest } from "@/lib/auth-helpers";

export async function PATCH(req: Request) {
  const me = await getSessionUser();
  if (!me) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid request body");
  }
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const d = parsed.data;
  await prisma.profile.upsert({
    where: { userId: me.id },
    update: {
      displayName: d.displayName || null,
      bio: d.bio || null,
      location: d.location || null,
      website: d.website || null,
      avatarUrl: d.avatarUrl || null,
    },
    create: {
      userId: me.id,
      displayName: d.displayName || me.username,
      bio: d.bio || null,
      location: d.location || null,
      website: d.website || null,
      avatarUrl: d.avatarUrl || null,
    },
  });

  if (d.displayName) {
    await prisma.user.update({ where: { id: me.id }, data: { name: d.displayName } });
  }

  return NextResponse.json({ ok: true });
}
