// Seed: members, categories, default news sources, global chat room.
// Member bios use only public, non-sensitive info — no personal data is invented.

import { PrismaClient, SourceLabel, SourceType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const MEMBERS = [
  {
    slug: "minji",
    name: "Minji",
    nickname: "Minji",
    bio: "Leader of NewJeans. Known for her calm presence and distinctive vocals.",
    order: 1,
  },
  {
    slug: "hanni",
    name: "Hanni",
    nickname: "Hanni",
    bio: "Member of NewJeans. Known for her bright energy and multilingual charm.",
    order: 2,
  },
  {
    slug: "danielle",
    name: "Danielle",
    nickname: "Danielle",
    bio: "Member of NewJeans. Known for her warm vocals and radiant stage presence.",
    order: 3,
  },
  {
    slug: "haerin",
    name: "Haerin",
    nickname: "Haerin",
    bio: "Member of NewJeans. Known for her unique tone and captivating performances.",
    order: 4,
  },
  {
    slug: "hyein",
    name: "Hyein",
    nickname: "Hyein",
    bio: "Member of NewJeans. Known for her powerful vocals and confident artistry.",
    order: 5,
  },
];

const CATEGORIES = [
  { slug: "official", name: "Official", description: "Official announcements and statements", order: 1 },
  { slug: "news", name: "News", description: "General news coverage", order: 2 },
  { slug: "music", name: "Music", description: "Releases, MVs, and music news", order: 3 },
  { slug: "appearance", name: "Appearance", description: "Performances, events, and appearances", order: 4 },
  { slug: "social-media", name: "Social Media", description: "Social media activity", order: 5 },
  { slug: "schedule", name: "Schedule", description: "Schedules and upcoming activities", order: 6 },
  { slug: "member-updates", name: "Member Updates", description: "Individual member news", order: 7 },
];

const SOURCES = [
  {
    name: "Google News — NewJeans",
    type: SourceType.GOOGLE_NEWS,
    url: "https://news.google.com/rss/search?q=NewJeans&hl=en-US&gl=US&ceid=US:en",
    label: SourceLabel.NEWS,
    enabled: true,
  },
  {
    name: "NewJeans Official YouTube",
    type: SourceType.YOUTUBE,
    // Official NewJeans YouTube channel feed (public RSS, no auth required).
    // NOTE: youtube.com/robots.txt currently Disallows /feeds/videos.xml for
    // generic user-agents, so this source ships DISABLED to respect robots.txt.
    // Enable it only if YouTube's policy changes, or use the official YouTube
    // Data API (YOUTUBE_API_KEY) instead.
    url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCMki_UkHb4qUYZNB0KVhWJpg",
    label: SourceLabel.OFFICIAL,
    enabled: false,
  },
];

async function main() {
  for (const m of MEMBERS) {
    await prisma.member.upsert({
      where: { slug: m.slug },
      update: { name: m.name, nickname: m.nickname, bio: m.bio, order: m.order },
      create: { ...m, imageUrl: null },
    });
  }
  console.log("✓ members");

  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, order: c.order },
      create: c,
    });
  }
  console.log("✓ categories");

  for (const s of SOURCES) {
    const existing = await prisma.newsSource.findFirst({ where: { url: s.url } });
    if (!existing) await prisma.newsSource.create({ data: s });
  }
  console.log("✓ sources");

  await prisma.chatRoom.upsert({
    where: { slug: "global" },
    update: {},
    create: {
      slug: "global",
      name: "Bunnies Global Chat",
      description: "Chat with NewJeans fans from all over the world.",
    },
  });
  console.log("✓ chat room");

  // Optional: create an initial admin via env (ADMIN_EMAIL / ADMIN_PASSWORD)
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const hash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: "ADMIN" },
      create: {
        email: adminEmail,
        username: adminEmail.split("@")[0],
        name: "Admin",
        passwordHash: hash,
        role: "ADMIN",
        emailVerified: new Date(),
        profile: { create: { displayName: "Admin" } },
      },
    });
    console.log("✓ admin user");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
