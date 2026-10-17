import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reactionSchema } from "@/lib/validation";
import { getSessionUser, unauthorized, badRequest, tooManyRequests } from "@/lib/auth-helpers";
import { rateLimit, pruneBuckets } from "@/lib/rate-limit";
import { notify } from "@/lib/notifications";

const TARGET_MODELS = {
  POST: "post",
  COMMENT: "comment",
  UPDATE: "newsUpdate",
} as const;

export async function POST(req: Request) {
  pruneBuckets();
  const me = await getSessionUser();
  if (!me) return unauthorized();

  const rl = rateLimit(`react:${me.id}`, { limit: 60, windowSec: 60, prefix: "community" });
  if (!rl.allowed) return tooManyRequests();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid request body");
  }
  const parsed = reactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { targetType, targetId, kind } = parsed.data;

  // Verify the target exists (and is visible)
  const model = TARGET_MODELS[targetType];
  const target = await (prisma[model] as unknown as { findUnique: (a: unknown) => Promise<{ id: string; authorId?: string } | null> }).findUnique({
    where: { id: targetId },
  });
  if (!target) return NextResponse.json({ error: "Target not found" }, { status: 404 });

  const existing = await prisma.reaction.findUnique({
    where: { userId_targetType_targetId_kind: { userId: me.id, targetType, targetId, kind } },
  });

  let liked: boolean;
  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    liked = false;
  } else {
    await prisma.reaction.create({ data: { userId: me.id, targetType, targetId, kind } });
    liked = true;
    // Notify the content owner (best-effort)
    if (target.authorId && target.authorId !== me.id) {
      const link =
        targetType === "POST" ? "/community" : targetType === "UPDATE" ? `/updates/${targetId}` : "/community";
      notify(target.authorId, "LIKE", `@${me.username} liked your ${targetType.toLowerCase()}`, { link });
    }
  }

  const count = await prisma.reaction.count({ where: { targetType, targetId } });
  return NextResponse.json({ liked, count });
}
