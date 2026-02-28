import React, { useEffect, useMemo, useState } from "react";
import { SETTINGS_KEYS, getSetting, setSetting } from "../../utils/settings";
import GitHubImportSection from "./GitHubImportButton";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const initialGeminiKey = useMemo(() => getSetting(SETTINGS_KEYS.GEMINI_API_KEY) ?? "", []);
  const [geminiApiKey, setGeminiApiKey] = useState(initialGeminiKey);
  const [openaiApiKey, setOpenaiApiKey] = useState(getSetting(SETTINGS_KEYS.OPENAI_API_KEY) ?? "");
  const [groqApiKey, setGroqApiKey] = useState(getSetting(SETTINGS_KEYS.GROQ_API_KEY) ?? "");
  const [showKey, setShowKey] = useState(false);
  const [theme, setTheme] = useState(getSetting(SETTINGS_KEYS.THEME) || "system");
  const [timeoutMs, setTimeoutMs] = useState(getSetting(SETTINGS_KEYS.REQUEST_TIMEOUT_MS) || "30000");
  const [showLineNumbers, setShowLineNumbers] = useState(getSetting(SETTINGS_KEYS.SHOW_LINE_NUMBERS) !== "false");
  const [enableAnalytics, setEnableAnalytics] = useState(getSetting(SETTINGS_KEYS.ENABLE_ANALYTICS) === "true");
  const [aiProvider, setAiProvider] = useState(getSetting(SETTINGS_KEYS.AI_PROVIDER) || "gemini");
  const [aiModel, setAiModel] = useState(getSetting(SETTINGS_KEYS.AI_MODEL) || "gemini-2.5-flash-lite");
  const [openaiModel, setOpenaiModel] = useState(getSetting(SETTINGS_KEYS.OPENAI_MODEL) || "gpt-4.1-mini");
  const [groqModel, setGroqModel] = useState(getSetting(SETTINGS_KEYS.GROQ_MODEL) || "llama-3.1-8b-instant");
  const [activeSection, setActiveSection] = useState<"general" | "appearance" | "ai" | "privacy" | "githubimport">("general");

  useEffect(() => {
    if (!isOpen) return;
    setGeminiApiKey(getSetting(SETTINGS_KEYS.GEMINI_API_KEY) ?? "");
    setOpenaiApiKey(getSetting(SETTINGS_KEYS.OPENAI_API_KEY) ?? "");
    setGroqApiKey(getSetting(SETTINGS_KEYS.GROQ_API_KEY) ?? "");
    setTheme(getSetting(SETTINGS_KEYS.THEME) || "system");
    setTimeoutMs(getSetting(SETTINGS_KEYS.REQUEST_TIMEOUT_MS) || "30000");
    setShowLineNumbers(getSetting(SETTINGS_KEYS.SHOW_LINE_NUMBERS) !== "false");
    setEnableAnalytics(getSetting(SETTINGS_KEYS.ENABLE_ANALYTICS) === "true");
    setAiProvider(getSetting(SETTINGS_KEYS.AI_PROVIDER) || "gemini");
    setAiModel(getSetting(SETTINGS_KEYS.AI_MODEL) || "gemini-2.5-flash-lite");
    setOpenaiModel(getSetting(SETTINGS_KEYS.OPENAI_MODEL) || "gpt-4.1-mini");
    setGroqModel(getSetting(SETTINGS_KEYS.GROQ_MODEL) || "llama-3.1-8b-instant");
    setActiveSection("general");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    setSetting(SETTINGS_KEYS.GEMINI_API_KEY, geminiApiKey.trim());
    setSetting(SETTINGS_KEYS.OPENAI_API_KEY, openaiApiKey.trim());
    setSetting(SETTINGS_KEYS.GROQ_API_KEY, groqApiKey.trim());
    setSetting(SETTINGS_KEYS.THEME, theme);
    setSetting(SETTINGS_KEYS.REQUEST_TIMEOUT_MS, timeoutMs.trim());
    setSetting(SETTINGS_KEYS.SHOW_LINE_NUMBERS, showLineNumbers ? "true" : "false");
    setSetting(SETTINGS_KEYS.ENABLE_ANALYTICS, enableAnalytics ? "true" : "false");
    setSetting(SETTINGS_KEYS.AI_PROVIDER, aiProvider);
    setSetting(SETTINGS_KEYS.AI_MODEL, aiModel);
    setSetting(SETTINGS_KEYS.OPENAI_MODEL, openaiModel);
    setSetting(SETTINGS_KEYS.GROQ_MODEL, groqModel);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-[min(760px,95vw)] rounded-lg border border-white/10 bg-[#18182a] shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="text-lg font-semibold text-white">Settings</div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition"
            aria-label="Close settings"
            title="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex max-h-[70vh]">
          {/* Left side navigation */}
          <nav className="w-48 border-r border-white/10 px-3 py-4 space-y-1 text-sm text-white/80">
            <button
              type="button"
              onClick={() => setActiveSection("general")}
              className={`w-full text-left rounded-md px-3 py-2 transition ${
                activeSection === "general"
                  ? "bg-blue-600 text-white"
                  : "hover:bg-white/5"
              }`}
            >
              General
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("appearance")}
              className={`w-full text-left rounded-md px-3 py-2 transition ${
                activeSection === "appearance"
                  ? "bg-blue-600 text-white"
                  : "hover:bg-white/5"
              }`}
            >
              Appearance
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("ai")}
              className={`w-full text-left rounded-md px-3 py-2 transition ${
                activeSection === "ai"
                  ? "bg-blue-600 text-white"
                  : "hover:bg-white/5"
              }`}
            >
              AI &amp; API
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("privacy")}
              className={`w-full text-left rounded-md px-3 py-2 transition ${
                activeSection === "privacy"
                  ? "bg-blue-600 text-white"
                  : "hover:bg-white/5"
              }`}
            >
              Privacy
            </button>

            <button
              type="button"
              onClick={() => setActiveSection("githubimport")}
              className={`w-full text-left rounded-md px-3 py-2 transition ${
                activeSection === "privacy"
                  ? "bg-blue-600 text-white"
                  : "hover:bg-white/5"
              }`}
            >
              GitHub Import
            </button>
          </nav>

          {/* Right side content */}
          <div className="flex-1 px-5 py-4 overflow-y-auto custom-scrollbar space-y-6">
            {activeSection === "general" && (
              <section>
                <div className="text-sm font-semibold text-white mb-1">
                  General
                </div>
                <p className="text-xs text-white/60 mb-4">
                  Basic behavior for requests and the editor.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      Request timeout (ms)
                    </label>
                    <p className="text-xs text-white/60 mb-2">
                      How long to wait before considering a request as timed out.
                    </p>
                    <input
                      type="number"
                      min={1000}
                      step={1000}
                      value={timeoutMs}
                      onChange={(e) => setTimeoutMs(e.target.value)}
                      className="bg-[#101022] text-white rounded px-3 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/60 w-40"
                    />
                  </div>

                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showLineNumbers}
                      onChange={(e) => setShowLineNumbers(e.target.checked)}
                      className="h-4 w-4 rounded border border-white/30 bg-[#101022]"
                    />
                    <span className="text-sm text-white">
                      Show line numbers in editors
                    </span>
                  </label>
                </div>
              </section>
            )}

            {activeSection === "appearance" && (
              <section>
                <div className="text-sm font-semibold text-white mb-1">
                  Appearance
                </div>
                <p className="text-xs text-white/60 mb-4">
                  Control CallSensei&apos;s look and feel.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      Theme
                    </label>
                    <p className="text-xs text-white/60 mb-2">
                      System follows your OS theme; Light and Dark force a specific mode.
                    </p>
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      className="bg-[#101022] text-white rounded px-3 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                    >
                      <option value="system">System</option>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>
                </div>
              </section>
            )}

            {activeSection === "ai" && (
              <section>
                <div className="text-sm font-semibold text-white mb-1">
                  AI &amp; API
                </div>
                <p className="text-xs text-white/60 mb-4">
                  Configure which AI provider CallSensei uses and manage the corresponding API keys and models.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      Provider
                    </label>
                    <p className="text-xs text-white/60 mb-2">
                      Choose your AI backend. Gemini is the current implementation; OpenAI and Groq are configuration-only for now.
                    </p>
                    <select
                      value={aiProvider}
                      onChange={(e) => setAiProvider(e.target.value)}
                      className="bg-[#101022] text-white rounded px-3 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                    >
                      <option value="gemini">Gemini</option>
                      <option value="openai">OpenAI</option>
                      <option value="groq">Groq</option>
                    </select>
                  </div>

                  {/* Provider-specific configuration */}
                  {aiProvider === "gemini" && (
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-white/60 mb-1">
                          Gemini / LangChain API key
                        </div>
                        <p className="text-xs text-white/70 mb-2">
                          If empty, the app falls back to{" "}
                          <span className="font-mono">VITE_GEMINI_API_KEY</span>.
                        </p>
                        <div className="flex gap-2">
                          <input
                            value={geminiApiKey}
                            onChange={(e) => setGeminiApiKey(e.target.value)}
                            type={showKey ? "text" : "password"}
                            placeholder="Paste Gemini API key…"
                            className="flex-1 bg-[#101022] text-white rounded px-3 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                          />
                          <button
                            type="button"
                            onClick={() => setShowKey((s) => !s)}
                            className="px-3 py-2 rounded border border-white/10 text-white/80 hover:text-white hover:border-white/20 transition"
                          >
                            {showKey ? "Hide" : "Show"}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-1">
                          Gemini model
                        </label>
                        <p className="text-xs text-white/60 mb-2">
                          Select which Gemini model to use for AI features.
                        </p>
                        <select
                          value={aiModel}
                          onChange={(e) => setAiModel(e.target.value)}
                          className="bg-[#101022] text-white rounded px-3 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                        >
                          <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite (fast)</option>
                          <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                          <option value="gemini-2.0-pro">gemini-2.0-pro</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {aiProvider === "openai" && (
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-white/60 mb-1">
                          OpenAI API key
                        </div>
                        <p className="text-xs text-white/70 mb-2">
                          Used when OpenAI is selected as the provider. Stored only on this machine.
                        </p>
                        <div className="flex gap-2">
                          <input
                            value={openaiApiKey}
                            onChange={(e) => setOpenaiApiKey(e.target.value)}
                            type={showKey ? "text" : "password"}
                            placeholder="Paste OpenAI API key…"
                            className="flex-1 bg-[#101022] text-white rounded px-3 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                          />
                          <button
                            type="button"
                            onClick={() => setShowKey((s) => !s)}
                            className="px-3 py-2 rounded border border-white/10 text-white/80 hover:text-white hover:border-white/20 transition"
                          >
                            {showKey ? "Hide" : "Show"}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-1">
                          OpenAI model
                        </label>
                        <p className="text-xs text-white/60 mb-2">
                          Choose which OpenAI chat model should be used.
                        </p>
                        <select
                          value={openaiModel}
                          onChange={(e) => setOpenaiModel(e.target.value)}
                          className="bg-[#101022] text-white rounded px-3 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                        >
                          <option value="gpt-4.1-mini">gpt-4.1-mini</option>
                          <option value="gpt-4.1">gpt-4.1</option>
                          <option value="gpt-4o-mini">gpt-4o-mini</option>
                          <option value="gpt-4o">gpt-4o</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {aiProvider === "groq" && (
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-white/60 mb-1">
                          Groq API key
                        </div>
                        <p className="text-xs text-white/70 mb-2">
                          Used when Groq is selected as the provider. Stored only on this machine.
                        </p>
                        <div className="flex gap-2">
                          <input
                            value={groqApiKey}
                            onChange={(e) => setGroqApiKey(e.target.value)}
                            type={showKey ? "text" : "password"}
                            placeholder="Paste Groq API key…"
                            className="flex-1 bg-[#101022] text-white rounded px-3 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                          />
                          <button
                            type="button"
                            onClick={() => setShowKey((s) => !s)}
                            className="px-3 py-2 rounded border border-white/10 text-white/80 hover:text-white hover:border-white/20 transition"
                          >
                            {showKey ? "Hide" : "Show"}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-1">
                          Groq model
                        </label>
                        <p className="text-xs text-white/60 mb-2">
                          Choose which Groq-hosted model should be used.
                        </p>
                        <select
                          value={groqModel}
                          onChange={(e) => setGroqModel(e.target.value)}
                          className="bg-[#101022] text-white rounded px-3 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                        >
                          <option value="llama-3.1-8b-instant">llama-3.1-8b-instant</option>
                          <option value="llama-3.1-70b-versatile">llama-3.1-70b-versatile</option>
                          <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeSection === "privacy" && (
              <section>
                <div className="text-sm font-semibold text-white mb-1">
                  Privacy
                </div>
                <p className="text-xs text-white/60 mb-4">
                  Control what anonymous data is collected to improve CallSensei.
                </p>
                <div className="space-y-2">
                  <label className="inline-flex items-start gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={enableAnalytics}
                      onChange={(e) => setEnableAnalytics(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border border-white/30 bg-[#101022]"
                    />
                    <span className="text-sm text-white">
                      Allow anonymous usage analytics
                      <span className="block text-xs text-white/60">
                        Helps us understand which features are used the most. No request or response data is sent.
                      </span>
                    </span>
                  </label>
                </div>
              </section>
            )} 
            
            {activeSection === "githubimport" && (
              <GitHubImportSection />
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border border-white/10 text-white/80 hover:text-white hover:border-white/20 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

