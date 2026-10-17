import { describe, it, expect } from "vitest";
import { isModeratorRole } from "../lib/permissions";

describe("authorization helpers", () => {
  it("recognizes moderator roles", () => {
    expect(isModeratorRole("ADMIN")).toBe(true);
    expect(isModeratorRole("MODERATOR")).toBe(true);
    expect(isModeratorRole("USER")).toBe(false);
  });
});
