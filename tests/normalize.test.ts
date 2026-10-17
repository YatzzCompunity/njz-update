import { describe, it, expect } from "vitest";
import {
  canonicalizeUrl,
  normalizeTitle,
  canonicalGroupKey,
  cleanHtml,
  makeSummary,
} from "../lib/ingestion/normalize";

describe("canonicalizeUrl", () => {
  it("strips tracking params and fragments", () => {
    expect(
      canonicalizeUrl("https://example.com/news/a?utm_source=x&fbclid=123#top")
    ).toBe("https://example.com/news/a");
  });
  it("keeps meaningful params, sorted", () => {
    expect(canonicalizeUrl("https://example.com/s?b=2&a=1")).toBe(
      "https://example.com/s?a=1&b=2"
    );
  });
  it("lowercases and trims", () => {
    expect(canonicalizeUrl("  HTTPS://Example.COM/A/ ")).toBe("https://example.com/a");
  });
  it("returns input lowercased when not a URL", () => {
    expect(canonicalizeUrl("not a url")).toBe("not a url");
  });
});

describe("normalizeTitle", () => {
  it("lowercases and collapses whitespace", () => {
    expect(normalizeTitle("  NewJeans   COMEBACK!! ")).toBe("newjeans comeback");
  });
  it("strips outlet suffixes", () => {
    expect(normalizeTitle("NewJeans announces tour - Soompi")).toBe("newjeans announces tour");
  });
  it("treats near-identical headlines as equal", () => {
    const a = normalizeTitle("NewJeans 'How Sweet' MV hits 100M views | Koreaboo");
    const b = normalizeTitle("NewJeans 'How Sweet' MV Hits 100M Views - Koreaboo");
    expect(a).toBe(b);
  });
});

describe("canonicalGroupKey", () => {
  it("is stable and groups identical normalized titles", () => {
    const a = normalizeTitle("NewJeans wins award");
    expect(canonicalGroupKey(a)).toBe(canonicalGroupKey(normalizeTitle("NewJeans Wins Award!")));
  });
  it("differs for different stories", () => {
    expect(canonicalGroupKey(normalizeTitle("Story A"))).not.toBe(
      canonicalGroupKey(normalizeTitle("Story B"))
    );
  });
});

describe("cleanHtml", () => {
  it("strips tags, scripts and decodes entities", () => {
    expect(
      cleanHtml('<p>Hello <b>world</b></p><script>alert(1)</script>&nbsp;&amp;')
    ).toBe("Hello world &");
  });
});

describe("makeSummary", () => {
  it("never returns markup and truncates long text", () => {
    const s = makeSummary("<p>" + "word ".repeat(200) + "</p>", 100);
    expect(s).not.toContain("<");
    expect(s.length).toBeLessThanOrEqual(104);
    expect(s.endsWith("…")).toBe(true);
  });
  it("returns short text unchanged", () => {
    expect(makeSummary("short summary")).toBe("short summary");
  });
});
