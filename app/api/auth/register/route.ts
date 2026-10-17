import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation";
import { rateLimit, getClientIp, pruneBuckets } from "@/lib/rate-limit";

export async function POST(req: Request) {
  pruneBuckets();
  const ip = getClientIp(req);
  const rl = rateLimit(ip, { limit: 10, windowSec: 3600, prefix: "register" });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many attempts, try again later" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { username, email, password, displayName } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: normalizedEmail }, { username }] },
  });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email or username already exists" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      username,
      name: displayName ?? username,
      passwordHash,
      profile: { create: { displayName: displayName ?? username } },
    },
    select: { id: true, username: true, email: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
