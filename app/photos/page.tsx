import type { Metadata } from "next";
import { PhotosPageContent } from "@/components/photos-page-content";

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
  return <PhotosPageContent />;
}
