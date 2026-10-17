import type { Metadata } from "next";
import { Camera } from "lucide-react";
import { PhotoGallery } from "@/components/photo-gallery";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Photos",
  description:
    "NewJeans in frames — member photos, portraits, and moments. Browse the NJZ Update photo gallery.",
  openGraph: {
    title: "Photos | NJZ Update",
    description: "NewJeans in frames — member photos, portraits, and moments.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Photos | NJZ Update",
    description: "NewJeans in frames — member photos, portraits, and moments.",
  },
};

export default function PhotosPage() {
  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blush-500/15 via-lav-500/10 to-transparent p-8 sm:p-12">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blush-500 to-lav-500 text-white shadow-lg">
            <Camera size={24} />
          </span>
          <div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              NewJeans in Frames
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Member photos, portraits, and moments — all with proper credit.
            </p>
          </div>
        </div>
      </div>

      <PhotoGallery />

      <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
        This is a fan-made gallery. Photos are credited to their sources — click any photo for attribution.
        Not affiliated with or endorsed by NewJeans, ADOR, or HYBE.
      </p>
    </div>
  );
}
