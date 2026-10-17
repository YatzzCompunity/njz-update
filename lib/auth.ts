import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        identifier: { label: "Email or username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { identifier, password } = parsed.data;

        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: identifier.toLowerCase() }, { username: identifier }],
          },
        });
        if (!user || !user.passwordHash) return null;
        if (user.suspended) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
    // Google OAuth is wired up automatically when the env vars are present.
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { id: true, username: true, role: true, suspended: true },
        });
        if (!dbUser || dbUser.suspended) {
          // Force sign-out for suspended/deleted users
          return { ...token, suspended: true };
        }
        token.id = dbUser.id;
        token.username = dbUser.username;
        token.role = dbUser.role;
      }
      if (trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { username: true, role: true },
        });
        if (dbUser) {
          token.username = dbUser.username;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.suspended) {
        // Returning null-ish session forces client to treat as signed out
        return { ...session, user: undefined as never };
      }
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.id;
        (session.user as Record<string, unknown>).username = token.username;
        (session.user as Record<string, unknown>).role = token.role;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Give OAuth users a unique username + profile row
      if (user.id && !user.email) return;
      const base =
        (user.email?.split("@")[0] ?? "bunny")
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, "")
          .slice(0, 20) || "bunny";
      let username = base;
      for (let i = 0; i < 10; i++) {
        const taken = await prisma.user.findUnique({ where: { username } });
        if (!taken) break;
        username = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
      }
      await prisma.user.update({
        where: { id: user.id },
        data: {
          username,
          profile: { create: { displayName: user.name ?? username } },
        },
      });
    },
  },
};
