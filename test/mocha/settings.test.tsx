import { describe, it } from "mocha";
import { expect } from "chai";

import { getSetting, setSetting, SETTINGS_KEYS } from "../../src/utils/settings";

describe("settings utils (Mocha)", () => {
  it("setSetting persists and getSetting reads values", () => {
    window.localStorage.clear();
    setSetting(SETTINGS_KEYS.GEMINI_API_KEY, "abc123");
    expect(getSetting(SETTINGS_KEYS.GEMINI_API_KEY)).to.equal("abc123");
  });

  it("setSetting removes on empty string", () => {
    window.localStorage.clear();
    setSetting(SETTINGS_KEYS.GEMINI_API_KEY, "abc123");
    setSetting(SETTINGS_KEYS.GEMINI_API_KEY, "");
    expect(getSetting(SETTINGS_KEYS.GEMINI_API_KEY)).to.equal(null);
  });
});

