import { getSetting, setSetting, SETTINGS_KEYS } from "../../src/utils/settings";

describe("settings utils", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("setSetting persists and getSetting reads values", () => {
    setSetting(SETTINGS_KEYS.GEMINI_API_KEY, "abc123");
    expect(getSetting(SETTINGS_KEYS.GEMINI_API_KEY)).toBe("abc123");
  });

  it("setSetting removes when value is empty string", () => {
    setSetting(SETTINGS_KEYS.GEMINI_API_KEY, "abc123");
    setSetting(SETTINGS_KEYS.GEMINI_API_KEY, "");
    expect(getSetting(SETTINGS_KEYS.GEMINI_API_KEY)).toBeNull();
  });
});

