import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, forbidden, isModeratorRole } from "@/lib/auth-helpers";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const me = await getSessionUser();
  if (!me) return unauthorized();

  const message = await prisma.chatMessage.findUnique({ where: { id } });
  if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });

  const canDelete = message.authorId === me.id || isModeratorRole(me.role);
  if (!canDelete) return forbidden();

  await prisma.chatMessage.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
