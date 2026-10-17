import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/updates",
    "/photos",
    "/members",
    "/community",
    "/chat",
    "/search",
    "/login",
    "/register",
  ].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1 : 0.7,
  }));

  try {
    const [updates, members] = await Promise.all([
      prisma.newsUpdate.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 500,
      }),
      prisma.member.findMany({ select: { slug: true, updatedAt: true } }),
    ]);
    return [
      ...staticRoutes,
      ...updates.map((u) => ({
        url: `${SITE_URL}/updates/${u.slug}`,
        lastModified: u.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...members.map((m) => ({
        url: `${SITE_URL}/members/${m.slug}`,
        lastModified: m.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
