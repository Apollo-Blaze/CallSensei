import {
  formatRelativeTime,
  formatTimestamp,
  getCurrentTimestamp,
  isValidISOTimestamp,
} from "../../src/utils/dateUtils";

describe("dateUtils", () => {
  it("isValidISOTimestamp returns true for exact ISO strings", () => {
    const iso = "2026-03-30T10:20:30.000Z";
    expect(isValidISOTimestamp(iso)).toBe(true);
  });

  it("isValidISOTimestamp returns false for invalid ISO strings", () => {
    expect(isValidISOTimestamp("not-a-date")).toBe(false);
    expect(isValidISOTimestamp("2026-13-01T00:00:00.000Z")).toBe(false);
  });

  it("formatRelativeTime supports minute/hour/day pluralization", () => {
    jest.useFakeTimers();
    const now = new Date("2026-03-30T12:00:00.000Z");
    jest.setSystemTime(now);

    expect(formatRelativeTime(new Date(now.getTime() - 30_000).toISOString())).toBe(
      "Just now"
    );
    expect(formatRelativeTime(new Date(now.getTime() - 5 * 60_000).toISOString())).toBe(
      "5 minutes ago"
    );
    expect(formatRelativeTime(new Date(now.getTime() - 60 * 60_000).toISOString())).toBe(
      "1 hour ago"
    );
    expect(
      formatRelativeTime(new Date(now.getTime() - 2 * 24 * 60 * 60_000).toISOString())
    ).toBe("2 days ago");
    jest.useRealTimers();
  });

  it("formatTimestamp returns a non-error string", () => {
    expect(formatTimestamp("2026-03-30T10:20:30.000Z")).not.toBe("Invalid Date");
  });

  it("getCurrentTimestamp returns an ISO string", () => {
    const ts = getCurrentTimestamp();
    expect(typeof ts).toBe("string");
    expect(isValidISOTimestamp(ts)).toBe(true);
  });
});

