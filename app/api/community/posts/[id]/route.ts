import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postSchema } from "@/lib/validation";
import {
  getSessionUser,
  unauthorized,
  forbidden,
  isModeratorRole,
} from "@/lib/auth-helpers";
import { z } from "zod";

const moderateSchema = z.object({ hidden: z.boolean() });

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const me = await getSessionUser();
  if (!me) return unauthorized();

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const isAuthor = post.authorId === me.id;
  const canModerate = isModeratorRole(me.role);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Moderation action (hide/unhide)
  const mod = moderateSchema.safeParse(body);
  if (mod.success && !isAuthor) {
    if (!canModerate) return forbidden();
    await prisma.post.update({ where: { id }, data: { hidden: mod.data.hidden } });
    await prisma.adminAction.create({
      data: {
        adminId: me.id,
        action: mod.data.hidden ? "HIDE_POST" : "UNHIDE_POST",
        targetType: "POST",
        targetId: id,
      },
    });
    return NextResponse.json({ ok: true, hidden: mod.data.hidden });
  }

  // Author edit
  if (!isAuthor) return forbidden();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const updated = await prisma.post.update({
    where: { id },
    data: {
      content: parsed.data.content.trim(),
      imageUrl: parsed.data.imageUrl || null,
      linkUrl: parsed.data.linkUrl || null,
    },
  });
  return NextResponse.json({ post: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const me = await getSessionUser();
  if (!me) return unauthorized();

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const canDelete = post.authorId === me.id || isModeratorRole(me.role);
  if (!canDelete) return forbidden();

  await prisma.post.delete({ where: { id } });
  if (post.authorId !== me.id) {
    await prisma.adminAction.create({
      data: { adminId: me.id, action: "DELETE_POST", targetType: "POST", targetId: id },
    });
  }
  return NextResponse.json({ ok: true });
}
