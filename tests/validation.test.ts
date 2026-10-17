import { describe, it, expect } from "vitest";
import {
  registerSchema,
  postSchema,
  chatMessageSchema,
  reactionSchema,
  reportSchema,
  updateSchema,
} from "../lib/validation";

describe("registerSchema", () => {
  it("accepts valid input", () => {
    expect(
      registerSchema.safeParse({ username: "bunny_01", email: "a@b.com", password: "supersecret" }).success
    ).toBe(true);
  });
  it("rejects bad usernames and short passwords", () => {
    expect(
      registerSchema.safeParse({ username: "bad name!", email: "a@b.com", password: "short" }).success
    ).toBe(false);
  });
  it("rejects invalid email", () => {
    expect(
      registerSchema.safeParse({ username: "bunny", email: "nope", password: "supersecret" }).success
    ).toBe(false);
  });
});

describe("postSchema", () => {
  it("enforces the 2000 character limit", () => {
    expect(postSchema.safeParse({ content: "x".repeat(2001) }).success).toBe(false);
    expect(postSchema.safeParse({ content: "hello" }).success).toBe(true);
  });
  it("rejects empty posts", () => {
    expect(postSchema.safeParse({ content: "   " }).success).toBe(false);
  });
});

describe("chatMessageSchema", () => {
  it("enforces the 500 character limit", () => {
    expect(chatMessageSchema.safeParse({ content: "x".repeat(501) }).success).toBe(false);
    expect(chatMessageSchema.safeParse({ content: "hi bunnies" }).success).toBe(true);
  });
});

describe("reactionSchema", () => {
  it("only allows known target types", () => {
    expect(reactionSchema.safeParse({ targetType: "POST", targetId: "c".repeat(25) }).success).toBe(true);
    expect(reactionSchema.safeParse({ targetType: "USER", targetId: "c".repeat(25) }).success).toBe(false);
  });
});

describe("reportSchema", () => {
  it("requires a reason", () => {
    expect(
      reportSchema.safeParse({ targetType: "POST", targetId: "x", reason: "" }).success
    ).toBe(false);
  });
});

describe("updateSchema (admin)", () => {
  it("requires title, summary, source name and a valid source URL", () => {
    const base = {
      title: "T",
      summary: "S",
      sourceName: "Soompi",
      sourceUrl: "https://example.com/a",
    };
    expect(updateSchema.safeParse(base).success).toBe(true);
    expect(updateSchema.safeParse({ ...base, sourceUrl: "not-a-url" }).success).toBe(false);
  });
});
