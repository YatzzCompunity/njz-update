import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";
import { ChatWindow } from "@/components/chat-window";
import { DisclaimerBanner } from "@/components/footer";

export const metadata: Metadata = {
  title: "Chat",
  description: "Chat live with Bunnies around the world about NewJeans.",
};

export default function ChatPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-black tracking-tight">
          <MessageCircle className="text-blush-500" /> Bunnies Chat
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Live community chat. Keep it kind — spam and hate get removed.
        </p>
      </div>
      <ChatWindow roomSlug="global" />
      <DisclaimerBanner />
    </div>
  );
}
