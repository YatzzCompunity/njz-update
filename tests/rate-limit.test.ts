import { describe, it, expect } from "vitest";
import { rateLimit } from "../lib/rate-limit";

describe("rateLimit (token bucket)", () => {
  it("allows up to the limit then blocks", () => {
    const key = `test-${Date.now()}`;
    const opts = { limit: 3, windowSec: 60, prefix: "t" };
    expect(rateLimit(key, opts).allowed).toBe(true);
    expect(rateLimit(key, opts).allowed).toBe(true);
    expect(rateLimit(key, opts).allowed).toBe(true);
    const blocked = rateLimit(key, opts);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });
  it("isolates buckets by key", () => {
    const opts = { limit: 1, windowSec: 60, prefix: "t2" };
    expect(rateLimit(`a-${Date.now()}`, opts).allowed).toBe(true);
    expect(rateLimit(`b-${Date.now()}`, opts).allowed).toBe(true);
  });
});
