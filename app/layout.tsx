import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { getServerSession } from "next-auth";
import "./globals.css";
import { authOptions } from "@/lib/auth";
import { Providers } from "@/components/providers";
import { Navbar, MobileNav } from "@/components/navbar";
import { Footer } from "@/components/footer";

const inter = Inter({ subsets: ["latin"], display: "swap" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "NJZ Update — Everything NewJeans, in one place",
    template: "%s · NJZ Update",
  },
  description:
    "Latest NewJeans news, member updates, and a real-time community for Bunnies. An independent fan-made platform.",
  keywords: ["NewJeans", "K-pop", "Bunnies", "Minji", "Hanni", "Danielle", "Haerin", "Hyein", "news"],
  authors: [{ name: "NJZ Update" }],
  openGraph: {
    type: "website",
    siteName: "NJZ Update",
    title: "NJZ Update — Everything NewJeans, in one place",
    description: "Latest NewJeans news, member updates, and a real-time community for Bunnies.",
  },
  twitter: {
    card: "summary_large_image",
    title: "NJZ Update — Everything NewJeans, in one place",
    description: "Latest NewJeans news, member updates, and a real-time community for Bunnies.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "NJZ Update",
              url: SITE_URL,
              description: "Everything NewJeans, in one place — news, member updates, and community.",
              potentialAction: {
                "@type": "SearchAction",
                target: `${SITE_URL}/search?q={query}`,
                "query-input": "required name=query",
              },
            }),
          }}
        />
      </head>
      <body className={inter.className}>
        <Providers session={session}>
          <Navbar />
          <main className="mx-auto min-h-[70vh] w-full max-w-6xl px-4 pb-8 pt-6">
            {children}
          </main>
          <Footer />
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
