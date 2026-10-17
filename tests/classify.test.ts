import { describe, it, expect } from "vitest";
import { classifyCategory, detectMembers, verificationForLabel } from "../lib/ingestion/classify";

describe("classifyCategory", () => {
  it("detects music stories", () => {
    expect(classifyCategory("NewJeans drops new single teaser", "")).toBe("music");
  });
  it("detects official announcements", () => {
    expect(classifyCategory("ADOR releases official statement on NewJeans", "")).toBe("official");
  });
  it("detects appearances", () => {
    expect(classifyCategory("NewJeans to headline summer festival", "")).toBe("appearance");
  });
  it("detects social media stories", () => {
    expect(classifyCategory("Hanni posts new photos on Instagram", "")).toBe("social-media");
  });
  it("defaults to news", () => {
    expect(classifyCategory("Some random headline about nothing", "")).toBe("news");
  });
});

describe("detectMembers", () => {
  it("finds mentioned members", () => {
    const found = detectMembers("Minji and Hanni stun at event", "Danielle was absent");
    expect(found).toEqual(expect.arrayContaining(["minji", "hanni", "danielle"]));
    expect(found).not.toContain("haerin");
  });
  it("is case-insensitive", () => {
    expect(detectMembers("HAERIN shines", "")).toContain("haerin");
  });
  it("returns empty when nobody is mentioned", () => {
    expect(detectMembers("NewJeans announces world tour", "")).toEqual([]);
  });
});

describe("verificationForLabel", () => {
  it("maps labels to verification status", () => {
    expect(verificationForLabel("OFFICIAL")).toBe("VERIFIED");
    expect(verificationForLabel("NEWS")).toBe("PENDING");
    expect(verificationForLabel("COMMUNITY")).toBe("UNVERIFIED");
    expect(verificationForLabel("UNVERIFIED")).toBe("UNVERIFIED");
  });
});
