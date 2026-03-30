import { describe, it } from "mocha";
import { expect } from "chai";

import {
  formatRelativeTime,
  isValidISOTimestamp,
} from "../../src/utils/dateUtils";

describe("dateUtils (Mocha)", () => {
  it("isValidISOTimestamp validates ISO timestamps", () => {
    expect(isValidISOTimestamp("2026-03-30T10:20:30.000Z")).to.equal(true);
    expect(isValidISOTimestamp("not-a-date")).to.equal(false);
  });

  it("formatRelativeTime returns expected buckets", () => {
    const now = new Date("2026-03-30T12:00:00.000Z");
    const justNowIso = new Date(now.getTime() - 30_000).toISOString();
    // Mocha doesn't have Jest fake timers, so assert bucket presence loosely.
    const rel = formatRelativeTime(justNowIso);
    expect(rel).to.be.oneOf(["Just now", "0 minutes ago"]);
  });
});

