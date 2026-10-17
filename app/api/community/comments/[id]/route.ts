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

  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 });

  const canDelete = comment.authorId === me.id || isModeratorRole(me.role);
  if (!canDelete) return forbidden();

  await prisma.comment.delete({ where: { id } });
  if (comment.authorId !== me.id) {
    await prisma.adminAction.create({
      data: { adminId: me.id, action: "DELETE_COMMENT", targetType: "COMMENT", targetId: id },
    });
  }
  return NextResponse.json({ ok: true });
}
