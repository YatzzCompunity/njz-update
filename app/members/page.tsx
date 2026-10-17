export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { MemberCard } from "@/components/member-card";
import { DisclaimerBanner } from "@/components/footer";

export const metadata: Metadata = {
  title: "Members",
  description: "Meet the five members of NewJeans — Minji, Hanni, Danielle, Haerin, and Hyein.",
};

export default async function MembersPage() {
  const members = await prisma.member
    .findMany({ where: { active: true }, orderBy: { order: "asc" } })
    .catch(() => []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Members</h1>
        <p className="mt-1 text-sm text-zinc-500">
          The five stars of NewJeans. Tap a card for their latest updates and community buzz.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {members.map((m) => (
          <MemberCard key={m.id} member={m} />
        ))}
      </div>
      <DisclaimerBanner />
    </div>
  );
}
