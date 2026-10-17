import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const [
    totalUsers,
    totalPosts,
    totalComments,
    totalUpdates,
    pendingUpdates,
    openReports,
    recentActions,
    recentLogs,
    activeUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.comment.count(),
    prisma.newsUpdate.count({ where: { status: "PUBLISHED" } }),
    prisma.newsUpdate.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.adminAction.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { admin: { select: { username: true } } },
    }),
    prisma.refreshLog.findMany({ orderBy: { startedAt: "desc" }, take: 10 }),
    prisma.user.count({
      where: { updatedAt: { gte: new Date(Date.now() - 7 * 24 * 3600_000) } },
    }),
  ]);

  return NextResponse.json({
    overview: {
      totalUsers,
      activeUsers,
      totalPosts,
      totalComments,
      totalUpdates,
      pendingUpdates,
      openReports,
    },
    recentActions,
    recentLogs,
  });
}
