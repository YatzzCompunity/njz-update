import { z } from "zod";

// ── Auth ──────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username may only contain letters, numbers and _"),
  email: z.string().email("Invalid email address").max(254),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  displayName: z.string().max(50).optional(),
});

export const loginSchema = z.object({
  identifier: z.string().min(1, "Email or username is required").max(254),
  password: z.string().min(1, "Password is required").max(128),
});

export const profileSchema = z.object({
  displayName: z.string().max(50).optional(),
  bio: z.string().max(300).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url("Invalid URL").max(200).optional().or(z.literal("")),
  avatarUrl: z.string().url("Invalid URL").max(500).optional().or(z.literal("")),
});

// ── Community ─────────────────────────────────────────────────────────────

export const postSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Post cannot be empty")
    .max(2000, "Post is too long (max 2000 characters)"),
  imageUrl: z.string().url("Invalid image URL").max(1000).optional().or(z.literal("")),
  linkUrl: z.string().url("Invalid URL").max(1000).optional().or(z.literal("")),
});

export const commentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment is too long (max 1000 characters)"),
  parentId: z.string().cuid().optional(),
});

export const reactionSchema = z.object({
  targetType: z.enum(["POST", "COMMENT", "UPDATE"]),
  targetId: z.string().cuid(),
  kind: z.enum(["like", "love", "haha", "wow"]).default("like"),
});

export const bookmarkSchema = z.object({
  targetType: z.enum(["POST", "UPDATE"]),
  targetId: z.string().cuid(),
});

export const reportSchema = z.object({
  targetType: z.enum(["POST", "COMMENT", "CHAT_MESSAGE", "UPDATE", "USER"]),
  targetId: z.string().min(1).max(100),
  reason: z.string().min(1).max(100),
  details: z.string().max(1000).optional(),
});

// ── Chat ──────────────────────────────────────────────────────────────────

export const chatMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(500, "Message is too long (max 500 characters)"),
});

// ── Admin: news updates ───────────────────────────────────────────────────

export const updateSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  summary: z.string().min(1, "Summary is required").max(2000),
  sourceName: z.string().min(1, "Source name is required").max(200),
  sourceUrl: z.string().url("Source URL must be a valid URL").max(2000),
  imageUrl: z.string().url("Invalid image URL").max(1000).optional().or(z.literal("")),
  publishedAt: z.string().datetime().optional().or(z.literal("")),
  categoryId: z.string().cuid().optional().or(z.literal("")),
  memberIds: z.array(z.string().cuid()).max(5).default([]),
  verificationStatus: z.enum(["VERIFIED", "UNVERIFIED", "PENDING"]).default("UNVERIFIED"),
  status: z.enum(["DRAFT", "PENDING_REVIEW", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
});

export const photoSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  caption: z.string().max(2000).optional().or(z.literal("")),
  imageUrl: z.string().min(1, "Image URL is required").max(2000),
  memberId: z.string().cuid().optional().or(z.literal("")).nullable(),
  credit: z.string().min(1, "Credit is required").max(200),
  sourceUrl: z.string().url("Source URL must be a valid URL").max(2000).optional().or(z.literal("")),
  publishedAt: z.string().datetime().optional().or(z.literal("")),
  published: z.boolean().default(true),
  order: z.number().int().min(0).max(10000).default(0),
});

export const sourceSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["RSS", "YOUTUBE", "GOOGLE_NEWS", "MANUAL"]),
  url: z.string().url("Must be a valid URL").max(2000),
  label: z.enum(["OFFICIAL", "NEWS", "COMMUNITY", "UNVERIFIED"]),
  enabled: z.boolean().default(true),
  fetchIntervalMin: z.number().int().min(5).max(1440).default(15),
});

// ── Shared ────────────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const followSchema = z.object({
  targetType: z.enum(["MEMBER", "CATEGORY", "TOPIC"]),
  targetId: z.string().min(1).max(100),
});

export const notificationReadSchema = z.object({
  ids: z.array(z.string().cuid()).max(100).optional(),
  all: z.boolean().optional(),
});
