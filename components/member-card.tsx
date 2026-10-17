import Link from "next/link";
import { Card, Avatar } from "./ui";

export interface MemberCardData {
  slug: string;
  name: string;
  nickname?: string | null;
  bio?: string | null;
  imageUrl?: string | null;
}

export function MemberCard({ member }: { member: MemberCardData }) {
  return (
    <Link href={`/members/${member.slug}`}>
      <Card className="group flex flex-col items-center gap-3 p-6 text-center transition-transform hover:-translate-y-1">
        <Avatar src={member.imageUrl} name={member.name} size={88} className="ring-2 ring-blush-400/40" />
        <div>
          <h3 className="text-lg font-bold group-hover:text-blush-500">{member.name}</h3>
          {member.nickname && member.nickname !== member.name && (
            <p className="text-sm text-zinc-500">“{member.nickname}”</p>
          )}
        </div>
        {member.bio && (
          <p className="line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">{member.bio}</p>
        )}
      </Card>
    </Link>
  );
}
