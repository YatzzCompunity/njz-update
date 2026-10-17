export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin-dashboard";

export const metadata: Metadata = {
  title: "Admin",
  description: "NJZ Update admin dashboard",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage updates, sources, moderation, users, and announcements.
        </p>
      </div>
      <AdminDashboard />
    </div>
  );
}
