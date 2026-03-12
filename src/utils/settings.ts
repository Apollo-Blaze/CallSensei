export const SETTINGS_KEYS = {
  GEMINI_API_KEY: "callsensei.geminiApiKey",
  THEME: "callsensei.theme",
  REQUEST_TIMEOUT_MS: "callsensei.requestTimeoutMs",
  SHOW_LINE_NUMBERS: "callsensei.showLineNumbers",
  ENABLE_ANALYTICS: "callsensei.enableAnalytics",
  AI_MODEL: "callsensei.aiModel",
  AI_PROVIDER: "callsensei.aiProvider",
  OPENAI_API_KEY: "callsensei.openaiApiKey",
  GROQ_API_KEY: "callsensei.groqApiKey",
  OPENAI_MODEL: "callsensei.openaiModel",
  GROQ_MODEL: "callsensei.groqModel",
  OPENAI_BASE_URL: "callsensei.openaiBaseUrl", // 👈 new
} as const;

// getSetting and setSetting unchanged

export function getSetting(key: string): string | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setSetting(key: string, value: string): void {
  try {
    if (typeof window === "undefined") return;
    if (!value) {
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(key, value);
  } catch {
    // ignore persistence errors (e.g. storage disabled)
  }
}

