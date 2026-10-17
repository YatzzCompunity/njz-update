import { NextResponse } from "next/server";
import { runDueSources } from "@/lib/ingestion/pipeline";
import { notifyMemberFollowers } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // allow long feed runs (Vercel Pro); Hobby caps at 60s

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  const url = new URL(req.url);
  if (url.searchParams.get("secret") === secret) return true;
  // Vercel Cron sends its own header; also accept when invoked by Vercel's scheduler
  if (req.headers.get("x-vercel-cron") === "1" && process.env.VERCEL) return true;
  return false;
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await runDueSources();

  // Notify followers about newly published member updates
  try {
    const memberSlugs = ["minji", "hanni", "danielle", "haerin", "hyein"];
    const fresh = await prisma.newsUpdate.findMany({
      where: {
        status: "PUBLISHED",
        createdAt: { gte: new Date(Date.now() - 20 * 60_000) },
      },
      include: { members: { include: { member: true } } },
      take: 20,
    });
    for (const u of fresh) {
      for (const um of u.members) {
        if (memberSlugs.includes(um.member.slug)) {
          await notifyMemberFollowers(
            um.member.slug,
            um.member.name,
            u.title,
            `/updates/${u.slug}`
          );
        }
      }
    }
  } catch {
    /* best-effort */
  }

  const totalInserted = results.reduce((n, r) => n + r.inserted, 0);
  return NextResponse.json({
    ok: true,
    ranAt: new Date().toISOString(),
    sources: results.length,
    totalInserted,
    results,
  });
}

// Vercel Cron uses GET by default — support it with the same auth.
export async function GET(req: Request) {
  return POST(req);
}
