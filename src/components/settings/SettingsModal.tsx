import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { SETTINGS_KEYS, getSetting, setSetting } from "../../utils/settings";
import GitHubImportSection from "./GitHubImportButton";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}
interface ModelsResponse { data?: { id: string }[] }

// ── Small reusable glass input ────────────────────────────────────────────────
const SI: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (p) => (
  <input {...p} className={`bg-[#080d1a] text-white rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all duration-150 ${p.className ?? ""}`} />
);
const SS: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (p) => (
  <select {...p} className={`bg-[#080d1a] text-white rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all duration-150 ${p.className ?? ""}`} />
);

// ── Toggle switch ─────────────────────────────────────────────────────────────
const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; color?: string }> = ({ checked, onChange, color = "#22d3ee" }) => (
  // Track: w-11 (44px), h-6 (24px). Thumb: w-4 (16px), h-4 (16px).
  // Thumb travel: track(44) - thumb(16) - padding(4) = 24px
  // OFF: left=2px  ON: left=2px + translateX(20px) → right edge = 2+16+20=38 < 44-2=42 ✓
  <button type="button" onClick={() => onChange(!checked)}
    className="relative flex-shrink-0 rounded-full transition-all duration-200 focus:outline-none"
    style={{
      width: 44, height: 24,
      background: checked ? color : "rgba(148,163,184,0.15)",
      border: `1px solid ${checked ? color + "80" : "rgba(148,163,184,0.12)"}`,
      boxShadow: checked ? `0 0 8px ${color}40` : "none",
    }}>
    <span
      className="absolute bg-white rounded-full shadow-sm transition-all duration-200"
      style={{
        width: 16, height: 16,
        top: 3, left: 3,
        transform: checked ? "translateX(20px)" : "translateX(0px)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
      }}
    />
  </button>
);

// ── Section label ─────────────────────────────────────────────────────────────
const SLabel: React.FC<{ title: string; desc?: string }> = ({ title, desc }) => (
  <div className="mb-4">
    <div className="text-sm font-semibold text-white">{title}</div>
    {desc && <p className="text-xs text-white/50 mt-0.5">{desc}</p>}
  </div>
);

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const initialGeminiKey = useMemo(() => getSetting(SETTINGS_KEYS.GEMINI_API_KEY) ?? "", []);

  const [geminiApiKey,       setGeminiApiKey]       = useState(initialGeminiKey);
  const [openaiApiKey,       setOpenaiApiKey]        = useState(getSetting(SETTINGS_KEYS.OPENAI_API_KEY) ?? "");
  const [groqApiKey,         setGroqApiKey]          = useState(getSetting(SETTINGS_KEYS.GROQ_API_KEY) ?? "");
  const [showKey,            setShowKey]             = useState(false);
  const [theme,              setTheme]               = useState(getSetting(SETTINGS_KEYS.THEME) || "system");
  const [timeoutMs,          setTimeoutMs]           = useState(getSetting(SETTINGS_KEYS.REQUEST_TIMEOUT_MS) || "30000");
  const [showLineNumbers,    setShowLineNumbers]     = useState(getSetting(SETTINGS_KEYS.SHOW_LINE_NUMBERS) !== "false");
  const [enableAnalytics,    setEnableAnalytics]     = useState(getSetting(SETTINGS_KEYS.ENABLE_ANALYTICS) === "true");
  const [aiProvider,         setAiProvider]          = useState(getSetting(SETTINGS_KEYS.AI_PROVIDER) || "gemini");
  const [aiModel,            setAiModel]             = useState(getSetting(SETTINGS_KEYS.AI_MODEL) || "gemini-2.5-flash-lite");
  const [openaiModel,        setOpenaiModel]         = useState(getSetting(SETTINGS_KEYS.OPENAI_MODEL) || "gpt-4.1-mini");
  const [openaiBaseUrl,      setOpenaiBaseUrl]       = useState(getSetting(SETTINGS_KEYS.OPENAI_BASE_URL) ?? "");
  const [useCustomBaseUrl,   setUseCustomBaseUrl]    = useState(!!getSetting(SETTINGS_KEYS.OPENAI_BASE_URL));
  const [groqModel,          setGroqModel]           = useState(getSetting(SETTINGS_KEYS.GROQ_MODEL) || "llama-3.3-70b-versatile");
  // NEW: AI auto-analyze toggle
  const [aiAutoAnalyze,      setAiAutoAnalyze]       = useState(getSetting(SETTINGS_KEYS.AI_AUTO_ANALYZE) !== "false");

  const [fetchedModels,       setFetchedModels]       = useState<string[]>([]);
  const [fetchingModels,      setFetchingModels]      = useState(false);
  const [modelFetchError,     setModelFetchError]     = useState("");
  const [geminiModels,        setGeminiModels]        = useState<string[]>([]);
  const [fetchingGeminiModels,setFetchingGeminiModels]= useState(false);
  const [geminiModelError,    setGeminiModelError]    = useState("");
  const [groqModels,          setGroqModels]          = useState<string[]>([]);
  const [fetchingGroqModels,  setFetchingGroqModels]  = useState(false);
  const [groqModelError,      setGroqModelError]      = useState("");
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
    const savedBaseUrl = getSetting(SETTINGS_KEYS.OPENAI_BASE_URL) ?? "";
    setOpenaiBaseUrl(savedBaseUrl);
    setUseCustomBaseUrl(!!savedBaseUrl);
    setGroqModel(getSetting(SETTINGS_KEYS.GROQ_MODEL) || "llama-3.1-8b-instant");
    setAiAutoAnalyze(getSetting(SETTINGS_KEYS.AI_AUTO_ANALYZE) !== "false");
    setFetchedModels([]); setModelFetchError("");
    setGeminiModels([]); setGeminiModelError(""); setFetchingGeminiModels(false);
    setGroqModels([]); setGroqModelError(""); setFetchingGroqModels(false);
    setActiveSection("general");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || aiProvider !== "gemini" || geminiModels.length > 0 || fetchingGeminiModels || geminiModelError) return;
    const envKey = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim() ?? "";
    const key = geminiApiKey.trim() || envKey;
    if (key) fetchGeminiModels(key);
  }, [isOpen, aiProvider, geminiApiKey, geminiModels.length, fetchingGeminiModels]);

  useEffect(() => {
    if (!isOpen || aiProvider !== "groq" || groqModels.length > 0 || fetchingGroqModels || groqModelError) return;
    const envKey = (import.meta.env.VITE_GROQ_API_KEY as string | undefined)?.trim() ?? "";
    const key = groqApiKey.trim() || envKey;
    if (key) fetchGroqModels(key);
  }, [isOpen, aiProvider, groqApiKey, groqModels.length, fetchingGroqModels]);

  if (!isOpen) return null;

  const fetchModelsFromBaseUrl = async (baseUrl: string, apiKey: string) => {
    if (!baseUrl.trim() || !apiKey.trim()) { setModelFetchError("Enter both Base URL and API key."); return; }
    setFetchingModels(true); setModelFetchError(""); setFetchedModels([]);
    try {
      const res = await fetch(`${baseUrl.trim().replace(/\/$/, "")}/models`, { headers: { Authorization: `Bearer ${apiKey.trim()}` } });
      if (res.status === 401 || res.status === 400) { setModelFetchError("Invalid API key or unauthorized."); return; }
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data: ModelsResponse = await res.json();
      const ids = [...new Set((data.data ?? []).map(m => m.id))].sort();
      if (!ids.length) throw new Error("No models returned.");
      setFetchedModels(ids);
      if (!ids.includes(openaiModel)) setOpenaiModel(ids[0]);
    } catch (err) { setModelFetchError(err instanceof Error ? err.message : "Failed."); }
    finally { setFetchingModels(false); }
  };

  const fetchGeminiModels = async (apiKey: string) => {
    if (!apiKey.trim()) { setGeminiModelError("Enter Gemini API key."); return; }
    setFetchingGeminiModels(true); setGeminiModelError(""); setGeminiModels([]);
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey.trim())}`);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data: any = await res.json();
      const ids = [...new Set<string>((data.models ?? []).map((m: any) => m.name?.replace(/^models\//, "")).filter(Boolean))].sort();
      if (!ids.length) throw new Error("No models returned.");
      setGeminiModels(ids);
      if (!ids.includes(aiModel)) setAiModel(ids[0]);
    } catch (err) { setGeminiModelError(err instanceof Error ? err.message : "Failed."); }
    finally { setFetchingGeminiModels(false); }
  };

  const fetchGroqModels = async (apiKey: string) => {
    if (!apiKey.trim()) { setGroqModelError("Enter Groq API key."); return; }
    setFetchingGroqModels(true); setGroqModelError(""); setGroqModels([]);
    try {
      const res = await fetch("https://api.groq.com/openai/v1/models", { headers: { Authorization: `Bearer ${apiKey.trim()}` } });
      if (res.status === 401 || res.status === 400) { setGroqModelError("Invalid Groq API key."); return; }
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data: ModelsResponse = await res.json();
      const ids = [...new Set((data.data ?? []).map(m => m.id))].sort();
      if (!ids.length) throw new Error("No models returned.");
      setGroqModels(ids);
      if (!ids.includes(groqModel)) setGroqModel(ids[0]);
    } catch (err) { setGroqModelError(err instanceof Error ? err.message : "Failed."); }
    finally { setFetchingGroqModels(false); }
  };

  const handleSave = () => {
    setSetting(SETTINGS_KEYS.GEMINI_API_KEY,     geminiApiKey.trim());
    setSetting(SETTINGS_KEYS.OPENAI_API_KEY,     openaiApiKey.trim());
    setSetting(SETTINGS_KEYS.GROQ_API_KEY,       groqApiKey.trim());
    setSetting(SETTINGS_KEYS.THEME,              theme);
    setSetting(SETTINGS_KEYS.REQUEST_TIMEOUT_MS, timeoutMs.trim());
    setSetting(SETTINGS_KEYS.SHOW_LINE_NUMBERS,  showLineNumbers ? "true" : "false");
    setSetting(SETTINGS_KEYS.ENABLE_ANALYTICS,   enableAnalytics ? "true" : "false");
    setSetting(SETTINGS_KEYS.AI_PROVIDER,        aiProvider);
    setSetting(SETTINGS_KEYS.AI_MODEL,           aiModel);
    setSetting(SETTINGS_KEYS.OPENAI_MODEL,       openaiModel);
    setSetting(SETTINGS_KEYS.OPENAI_BASE_URL,    useCustomBaseUrl ? openaiBaseUrl.trim() : "");
    setSetting(SETTINGS_KEYS.GROQ_MODEL,         groqModel);
    setSetting(SETTINGS_KEYS.AI_AUTO_ANALYZE,    aiAutoAnalyze ? "true" : "false");

    // Manually fire a storage event so same-tab listeners (e.g. RequestForm)
    // pick up the changes — window.storage only fires across tabs natively.
    window.dispatchEvent(new StorageEvent("storage", {
      key:      SETTINGS_KEYS.AI_AUTO_ANALYZE,
      newValue: aiAutoAnalyze ? "true" : "false",
      storageArea: window.localStorage,
    }));

    onClose();
  };

  // ── Nav item ────────────────────────────────────────────────────────────────
  const NavItem: React.FC<{ id: typeof activeSection; label: string; icon: React.ReactNode }> = ({ id, label, icon }) => {
    const active = activeSection === id;
    return (
      <button type="button" onClick={() => setActiveSection(id)}
        className="w-full flex items-center gap-2.5 text-left rounded-lg px-3 py-2 text-sm transition-all duration-150"
        style={{
          color: active ? "#22d3ee" : "rgba(148,163,184,0.65)",
          background: active ? "rgba(34,211,238,0.08)" : "transparent",
          border: `1px solid ${active ? "rgba(34,211,238,0.2)" : "transparent"}`,
        }}>
        <span className="flex-shrink-0 opacity-70">{icon}</span>
        {label}
        {active && <span className="ml-auto w-1 h-4 rounded-full flex-shrink-0" style={{ background: "#22d3ee", boxShadow: "0 0 6px #22d3ee" }} />}
      </button>
    );
  };

  const FetchBtn: React.FC<{ onClick: () => void; loading: boolean; disabled?: boolean }> = ({ onClick, loading, disabled }) => (
    <button type="button" onClick={onClick} disabled={loading || disabled}
      className="w-full py-2 rounded-lg text-sm transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: "rgba(148,163,184,0.06)", border: "1px solid rgba(148,163,184,0.12)", color: "rgba(148,163,184,0.8)" }}>
      {loading ? "Fetching models…" : "Fetch available models"}
    </button>
  );

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      role="dialog" aria-modal="true"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div className="w-[min(780px,95vw)] rounded-2xl overflow-hidden"
        style={{
          minWidth: 480,
          background: "linear-gradient(160deg, rgba(8,14,28,0.98) 0%, rgba(4,8,20,0.99) 100%)",
          backdropFilter: "blur(40px) saturate(180%)",
          border: "1px solid rgba(148,163,184,0.1)",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.5), 0 32px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(148,163,184,0.08)" }}>
          <div className="flex items-center gap-2.5">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-cyan-400">
              <path d="M8 1l1.5 3H13l-2.75 2 1 3L8 7.5 4.75 9l1-3L3 4h3.5L8 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
            <span className="text-sm font-semibold text-white tracking-wide">Settings</span>
          </div>
          <button onClick={onClose} className="flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-150 focus:outline-none"
            style={{ color: "rgba(148,163,184,0.5)", background: "transparent", border: "1px solid transparent" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#e2e8f0"; e.currentTarget.style.background = "rgba(148,163,184,0.08)"; e.currentTarget.style.borderColor = "rgba(148,163,184,0.15)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(148,163,184,0.5)"; e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}>
            <svg width="10" height="10" viewBox="0 0 9 9" fill="none"><path d="M1.5 1.5l6 6M7.5 1.5l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="flex" style={{ maxHeight: "72vh", minHeight: 400 }}>
          {/* Sidebar nav */}
          <nav className="flex-shrink-0 w-44 py-3 px-2 space-y-0.5 overflow-y-auto" style={{ borderRight: "1px solid rgba(148,163,184,0.06)" }}>
            <NavItem id="general" label="General" icon={<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.2"/><path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>} />
            <NavItem id="appearance" label="Appearance" icon={<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.2"/><path d="M7 4v3l2 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>} />
            <NavItem id="ai" label="AI & API" icon={<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 1a4 4 0 014 4v1h.5a2 2 0 010 4H10v1a4 4 0 01-8 0v-1H3.5a2 2 0 010-4H4V5a4 4 0 013-3.87" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>} />
            <NavItem id="privacy" label="Privacy" icon={<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 1L2 3.5v3.5C2 10 4.5 12.5 7 13c2.5-.5 5-3 5-6V3.5L7 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>} />
            <NavItem id="githubimport" label="GitHub Import" icon={<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 1a6 6 0 100 12A6 6 0 007 1zm0 0c0 2-1 3.5-2 4.5M7 1c0 2 1 3.5 2 4.5M5 9c.5 1.5 1 2.5 2 3m0 0c1-.5 1.5-1.5 2-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>} />
          </nav>

          {/* Content */}
          <div className="flex-1 px-5 py-4 overflow-y-auto custom-scrollbar space-y-5 text-sm">

            {/* GENERAL */}
            {activeSection === "general" && (
              <div>
                <SLabel title="General" desc="Basic behavior for requests and the editor." />
                <div className="space-y-4">

                  {/* Timeout */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">Request timeout (ms)</label>
                    <p className="text-xs text-white/50 mb-2">How long to wait before aborting the request automatically.</p>
                    <div className="flex items-center gap-3">
                      <SI type="number" min={1000} step={1000} value={timeoutMs} onChange={e => setTimeoutMs(e.target.value)} className="w-36" />
                      <span className="text-xs text-white/40">{Math.round(parseInt(timeoutMs || "30000") / 1000)}s</span>
                    </div>
                  </div>

                  {/* Line numbers */}
                  <div className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: "rgba(148,163,184,0.04)", border: "1px solid rgba(148,163,184,0.07)" }}>
                    <div>
                      <div className="text-sm text-white font-medium">Show line numbers</div>
                      <div className="text-xs text-white/40 mt-0.5">Display line numbers in code editors</div>
                    </div>
                    <Toggle checked={showLineNumbers} onChange={setShowLineNumbers} />
                  </div>
                </div>
              </div>
            )}

            {/* APPEARANCE */}
            {activeSection === "appearance" && (
              <div>
                <SLabel title="Appearance" desc="Control the look and feel." />
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Theme</label>
                  <SS value={theme} onChange={e => setTheme(e.target.value)} className="w-40">
                    <option value="system">System</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </SS>
                </div>
              </div>
            )}

            {/* AI & API */}
            {activeSection === "ai" && (
              <div>
                <SLabel title="AI & API" desc="Configure the AI provider, model, and when AI analysis runs." />
                <div className="space-y-4">

                  {/* AI Auto-analyze toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(34,211,238,0.04)", border: "1px solid rgba(34,211,238,0.12)" }}>
                    <div>
                      <div className="text-sm text-white font-medium flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-cyan-400 flex-shrink-0">
                          <rect x="7" y="7" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                          <line x1="10" y1="7" x2="10" y2="17" stroke="currentColor" strokeWidth="1"/>
                          <line x1="14" y1="7" x2="14" y2="17" stroke="currentColor" strokeWidth="1"/>
                          <line x1="7" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1"/>
                          <line x1="7" y1="14" x2="17" y2="14" stroke="currentColor" strokeWidth="1"/>
                          <line x1="10" y1="4" x2="10" y2="7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                          <line x1="14" y1="4" x2="14" y2="7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                          <line x1="10" y1="17" x2="10" y2="20" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                          <line x1="14" y1="17" x2="14" y2="20" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                          <line x1="4" y1="10" x2="7" y2="10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                          <line x1="4" y1="14" x2="7" y2="14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                          <line x1="17" y1="10" x2="20" y2="10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                          <line x1="17" y1="14" x2="20" y2="14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                        </svg>
                        AI analysis after each request
                      </div>
                      <div className="text-xs text-white/40 mt-0.5 ml-5">
                        When enabled, the AI will automatically explain every request/response. Disable to save API quota.
                      </div>
                    </div>
                    <Toggle checked={aiAutoAnalyze} onChange={setAiAutoAnalyze} color="#22d3ee" />
                  </div>

                  {/* Provider */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Provider</label>
                    <SS value={aiProvider} onChange={e => setAiProvider(e.target.value)} className="w-40">
                      <option value="gemini">Gemini</option>
                      <option value="openai">OpenAI</option>
                      <option value="groq">Groq</option>
                    </SS>
                  </div>

                  {/* GEMINI */}
                  {aiProvider === "gemini" && (
                    <div className="space-y-3 p-3 rounded-xl" style={{ background: "rgba(148,163,184,0.03)", border: "1px solid rgba(148,163,184,0.07)" }}>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-white/50 mb-1">Gemini API key</label>
                        <p className="text-xs text-white/40 mb-2">Falls back to <span className="font-mono text-white/60">VITE_GEMINI_API_KEY</span> if empty.</p>
                        <div className="flex gap-2">
                          <SI value={geminiApiKey} onChange={e => setGeminiApiKey(e.target.value)} type={showKey ? "text" : "password"} placeholder="Paste Gemini API key…" className="flex-1" />
                          <button type="button" onClick={() => setShowKey(s => !s)} className="px-3 py-2 rounded-lg text-xs text-white/60 hover:text-white transition" style={{ background: "rgba(148,163,184,0.06)", border: "1px solid rgba(148,163,184,0.1)" }}>{showKey ? "Hide" : "Show"}</button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Model</label>
                        <FetchBtn onClick={() => fetchGeminiModels(geminiApiKey)} loading={fetchingGeminiModels} disabled={!geminiApiKey.trim()} />
                        {geminiModelError && <p className="text-xs text-red-400 mt-1">{geminiModelError}</p>}
                        <div className="mt-2">
                          {geminiModels.length > 0
                            ? <SS value={aiModel} onChange={e => setAiModel(e.target.value)} className="w-full">{geminiModels.map(m => <option key={m} value={m}>{m}</option>)}</SS>
                            : <SS value={aiModel} onChange={e => setAiModel(e.target.value)}>
                                <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite (fast)</option>
                                <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                                <option value="gemini-2.0-pro">gemini-2.0-pro</option>
                              </SS>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* OPENAI */}
                  {aiProvider === "openai" && (
                    <div className="space-y-3 p-3 rounded-xl" style={{ background: "rgba(148,163,184,0.03)", border: "1px solid rgba(148,163,184,0.07)" }}>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-white/50 mb-1">API Key</label>
                        <div className="flex gap-2">
                          <SI value={openaiApiKey} onChange={e => setOpenaiApiKey(e.target.value)} type={showKey ? "text" : "password"} placeholder="Paste API key…" className="flex-1" />
                          <button type="button" onClick={() => setShowKey(s => !s)} className="px-3 py-2 rounded-lg text-xs text-white/60 hover:text-white transition" style={{ background: "rgba(148,163,184,0.06)", border: "1px solid rgba(148,163,184,0.1)" }}>{showKey ? "Hide" : "Show"}</button>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg space-y-3" style={{ background: "rgba(148,163,184,0.04)", border: "1px solid rgba(148,163,184,0.08)" }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-white font-medium">Custom Base URL</div>
                            <div className="text-xs text-white/40 mt-0.5">NVIDIA, Azure, LM Studio, etc.</div>
                          </div>
                          <Toggle checked={useCustomBaseUrl} onChange={v => { setUseCustomBaseUrl(v); setFetchedModels([]); setModelFetchError(""); if (!v) setOpenaiModel("gpt-4.1-mini"); }} />
                        </div>
                        {useCustomBaseUrl && (
                          <>
                            <SI value={openaiBaseUrl} onChange={e => { setOpenaiBaseUrl(e.target.value); setFetchedModels([]); setModelFetchError(""); }} placeholder="https://integrate.api.nvidia.com/v1" className="w-full" />
                            <FetchBtn onClick={() => fetchModelsFromBaseUrl(openaiBaseUrl, openaiApiKey)} loading={fetchingModels} disabled={!openaiBaseUrl.trim() || !openaiApiKey.trim()} />
                            {modelFetchError && <p className="text-xs text-red-400">{modelFetchError}</p>}
                          </>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Model</label>
                        {useCustomBaseUrl && fetchedModels.length > 0
                          ? <SS value={openaiModel} onChange={e => setOpenaiModel(e.target.value)} className="w-full">{fetchedModels.map(m => <option key={m} value={m}>{m}</option>)}</SS>
                          : useCustomBaseUrl
                            ? <SI value={openaiModel} onChange={e => setOpenaiModel(e.target.value)} placeholder="Type model name or fetch above…" className="w-full" />
                            : <SS value={openaiModel} onChange={e => setOpenaiModel(e.target.value)} className="w-full">
                                <option value="gpt-4.1-mini">gpt-4.1-mini</option>
                                <option value="gpt-4.1">gpt-4.1</option>
                                <option value="gpt-4o-mini">gpt-4o-mini</option>
                                <option value="gpt-4o">gpt-4o</option>
                              </SS>}
                      </div>
                    </div>
                  )}

                  {/* GROQ */}
                  {aiProvider === "groq" && (
                    <div className="space-y-3 p-3 rounded-xl" style={{ background: "rgba(148,163,184,0.03)", border: "1px solid rgba(148,163,184,0.07)" }}>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-white/50 mb-1">Groq API key</label>
                        <div className="flex gap-2">
                          <SI value={groqApiKey} onChange={e => setGroqApiKey(e.target.value)} type={showKey ? "text" : "password"} placeholder="Paste Groq API key…" className="flex-1" />
                          <button type="button" onClick={() => setShowKey(s => !s)} className="px-3 py-2 rounded-lg text-xs text-white/60 hover:text-white transition" style={{ background: "rgba(148,163,184,0.06)", border: "1px solid rgba(148,163,184,0.1)" }}>{showKey ? "Hide" : "Show"}</button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Model</label>
                        <FetchBtn onClick={() => fetchGroqModels(groqApiKey)} loading={fetchingGroqModels} disabled={!groqApiKey.trim()} />
                        {groqModelError && <p className="text-xs text-red-400 mt-1">{groqModelError}</p>}
                        <div className="mt-2">
                          {groqModels.length > 0
                            ? <SS value={groqModel} onChange={e => setGroqModel(e.target.value)} className="w-full">{groqModels.map(m => <option key={m} value={m}>{m}</option>)}</SS>
                            : <SS value={groqModel} onChange={e => setGroqModel(e.target.value)}>
                                <option value="llama-3.1-8b-instant">llama-3.1-8b-instant</option>
                                <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile</option>
                                <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
                              </SS>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PRIVACY */}
            {activeSection === "privacy" && (
              <div>
                <SLabel title="Privacy" desc="Control what anonymous data is collected." />
                <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(148,163,184,0.04)", border: "1px solid rgba(148,163,184,0.07)" }}>
                  <div>
                    <div className="text-sm text-white font-medium">Anonymous usage analytics</div>
                    <div className="text-xs text-white/40 mt-0.5">No request or response data is sent — only feature usage counts.</div>
                  </div>
                  <Toggle checked={enableAnalytics} onChange={setEnableAnalytics} />
                </div>
              </div>
            )}

            {/* GITHUB IMPORT */}
            {activeSection === "githubimport" && (
              <div>
                <SLabel title="GitHub Import" desc="Import request collections from a GitHub repository." />
                <GitHubImportSection />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3" style={{ borderTop: "1px solid rgba(148,163,184,0.08)" }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white transition" style={{ background: "transparent", border: "1px solid rgba(148,163,184,0.12)" }}>Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm font-medium text-white transition"
            style={{ background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.25)", color: "#22d3ee", boxShadow: "0 0 12px rgba(34,211,238,0.15)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(34,211,238,0.18)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(34,211,238,0.12)"; }}>
            Save changes
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SettingsModal;