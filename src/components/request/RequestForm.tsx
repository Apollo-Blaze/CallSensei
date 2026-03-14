import React, { useState as useStateR } from "react";
import { useDispatch } from "react-redux";
import { updateActivity } from "../../state/activitiesSlice";
import { useRequestFormState } from "../../hooks/useRequestFormState";
import { networkUtils } from "../../utils/network";
import type { BodyType } from "../../consts";
import "./RequestForm.css";
import type { RequestMethod } from "../../models";

// ── Method colour palette ─────────────────────────────────────────────────────
const METHOD_CONFIG: Record<string, { color: string; glow: string; bg: string; border: string; glassGlow: string }> = {
  GET:     { color: "#34d399", glow: "0 0 16px #34d39955", bg: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.25)",  glassGlow: "0 0 24px rgba(52,211,153,0.2),  inset 0 1px 0 rgba(255,255,255,0.08)" },
  POST:    { color: "#60a5fa", glow: "0 0 16px #60a5fa55", bg: "rgba(96,165,250,0.08)",  border: "rgba(96,165,250,0.25)",  glassGlow: "0 0 24px rgba(96,165,250,0.2),  inset 0 1px 0 rgba(255,255,255,0.08)" },
  PUT:     { color: "#f59e0b", glow: "0 0 16px #f59e0b55", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.25)",  glassGlow: "0 0 24px rgba(245,158,11,0.2),  inset 0 1px 0 rgba(255,255,255,0.08)" },
  PATCH:   { color: "#a78bfa", glow: "0 0 16px #a78bfa55", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.25)", glassGlow: "0 0 24px rgba(167,139,250,0.2), inset 0 1px 0 rgba(255,255,255,0.08)" },
  DELETE:  { color: "#f87171", glow: "0 0 16px #f8717155", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.25)", glassGlow: "0 0 24px rgba(248,113,113,0.2), inset 0 1px 0 rgba(255,255,255,0.08)" },
  HEAD:    { color: "#94a3b8", glow: "0 0 16px #94a3b855", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.22)", glassGlow: "0 0 24px rgba(148,163,184,0.15), inset 0 1px 0 rgba(255,255,255,0.07)" },
  OPTIONS: { color: "#fb923c", glow: "0 0 16px #fb923c55", bg: "rgba(251,146,60,0.08)",  border: "rgba(251,146,60,0.25)",  glassGlow: "0 0 24px rgba(251,146,60,0.2),  inset 0 1px 0 rgba(255,255,255,0.08)" },
};
const METHODS = Object.keys(METHOD_CONFIG);
const getCfg = (m: string) => METHOD_CONFIG[m] ?? METHOD_CONFIG["GET"];

function substituteVariables(text: string, vars: Record<string, string>) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, n) => vars[n] ?? `{{${n}}}`);
}
function isValidJson(s: string) {
  const t = s.trim();
  if (!t || (!t.startsWith("{") && !t.startsWith("["))) return false;
  try { JSON.parse(t); return true; } catch { return false; }
}

// ── Method pill selector ──────────────────────────────────────────────────────
const MethodSelect: React.FC<{ method: string; onChange: (m: string) => void }> = ({ method, onChange }) => {
  const [open, setOpen] = useStateR(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const cfg = getCfg(method);
  React.useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative flex-shrink-0" style={{ minWidth: 108 }}>
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase transition-all duration-200 focus:outline-none"
        style={{
          color: cfg.color,
          background: `linear-gradient(135deg, ${cfg.bg}, rgba(15,23,42,0.6))`,
          backdropFilter: "blur(16px) saturate(180%)", WebkitBackdropFilter: "blur(16px) saturate(180%)",
          border: `1px solid ${cfg.border}`,
          boxShadow: open ? cfg.glassGlow : "inset 0 1px 0 rgba(255,255,255,0.07), 0 2px 8px rgba(0,0,0,0.3)",
          letterSpacing: "0.12em",
        }}>
        <span>{method}</span>
        <svg className="w-3 h-3 opacity-50 transition-transform duration-200" style={{ transform: open ? "rotate(180deg)" : "none" }} viewBox="0 0 12 12" fill="none">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 z-50 rounded-2xl overflow-hidden"
          style={{
            minWidth: 128,
            background: "rgba(8,14,28,0.92)", backdropFilter: "blur(32px) saturate(200%)", WebkitBackdropFilter: "blur(32px) saturate(200%)",
            border: "1px solid rgba(148,163,184,0.14)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07), 0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,0,0,0.4)",
          }}>
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
          {METHODS.map(m => {
            const mc = getCfg(m); const isActive = m === method;
            return (
              <button key={m} type="button" onClick={() => { onChange(m); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold tracking-widest uppercase transition-all duration-150 focus:outline-none"
                style={{ color: mc.color, background: isActive ? `linear-gradient(90deg, ${mc.bg}, transparent)` : "transparent", letterSpacing: "0.12em", borderLeft: isActive ? `2px solid ${mc.color}` : "2px solid transparent" }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(148,163,184,0.06)"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: mc.color, boxShadow: isActive ? `0 0 6px ${mc.color}` : "none" }} />
                {m}
                {isActive && <svg className="ml-auto w-3 h-3 opacity-60" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── URL input ─────────────────────────────────────────────────────────────────
const UrlInput: React.FC<{ url: string; onChange: (u: string) => void; method: string }> = ({ url, onChange, method }) => {
  const cfg = getCfg(method);
  return (
    <div className="relative flex-1 group">
      <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full transition-all duration-300 group-focus-within:top-1 group-focus-within:bottom-1"
        style={{ background: cfg.color, opacity: 0.6, boxShadow: `0 0 8px ${cfg.color}` }} />
      <input type="text" value={url} onChange={e => onChange(e.target.value)}
        placeholder="https://api.example.com/endpoint" spellCheck={false}
        className="w-full pl-4 pr-4 py-2.5 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all duration-200 font-mono"
        style={{
          background: "rgba(15,23,42,0.55)", backdropFilter: "blur(16px) saturate(160%)", WebkitBackdropFilter: "blur(16px) saturate(160%)",
          border: "1px solid rgba(148,163,184,0.12)",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.03)",
        }}
        onFocus={e => { e.currentTarget.style.borderColor = cfg.border; e.currentTarget.style.boxShadow = `inset 0 1px 3px rgba(0,0,0,0.35), ${cfg.glow}`; }}
        onBlur={e => { e.currentTarget.style.borderColor = "rgba(148,163,184,0.12)"; e.currentTarget.style.boxShadow = "inset 0 1px 3px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.03)"; }}
      />
    </div>
  );
};

// ── Glass input field (shared) ────────────────────────────────────────────────
const GlassInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { list?: string }> = (props) => (
  <input {...props}
    className={`bg-transparent text-slate-200 text-sm placeholder-slate-500 focus:outline-none w-full px-3.5 py-2.5 rounded-xl transition-all duration-150 ${props.className ?? ""}`}
    style={{
      border: "1px solid rgba(148,163,184,0.1)",
      background: "rgba(15,23,42,0.4)",
      backdropFilter: "blur(8px)",
      ...props.style,
    }}
    onFocus={e => { e.currentTarget.style.borderColor = "rgba(148,163,184,0.3)"; e.currentTarget.style.background = "rgba(15,23,42,0.65)"; }}
    onBlur={e => { e.currentTarget.style.borderColor = "rgba(148,163,184,0.1)"; e.currentTarget.style.background = "rgba(15,23,42,0.4)"; }}
  />
);

// ── Delete button ─────────────────────────────────────────────────────────────
const DeleteBtn: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button type="button" onClick={onClick}
    className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-150 focus:outline-none"
    style={{ color: "rgba(248,113,113,0.5)", background: "transparent", border: "1px solid transparent" }}
    onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = "rgba(248,113,113,0.1)"; e.currentTarget.style.borderColor = "rgba(248,113,113,0.2)"; }}
    onMouseLeave={e => { e.currentTarget.style.color = "rgba(248,113,113,0.5)"; e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}>
    <svg width="8" height="8" viewBox="0 0 9 9" fill="none">
      <path d="M1.5 1.5l6 6M7.5 1.5l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  </button>
);

// ── URL Params tab ────────────────────────────────────────────────────────────
const UrlParamsTab: React.FC<{ url: string; onUrlChange: (u: string) => void }> = ({ url, onUrlChange }) => {
  // Parse params from URL
  const parseParams = (u: string): [string, string][] => {
    try {
      const idx = u.indexOf("?");
      if (idx === -1) return [["", ""]];
      const search = u.slice(idx + 1);
      const pairs = search.split("&").map(p => {
        const [k, ...v] = p.split("=");
        return [decodeURIComponent(k || ""), decodeURIComponent(v.join("=") || "")] as [string, string];
      }).filter(([k]) => k);
      return pairs.length ? [...pairs, ["", ""]] : [["", ""]];
    } catch { return [["", ""]]; }
  };

  const [rows, setRows] = useStateR<[string, string][]>(() => parseParams(url));

  const syncUrl = (newRows: [string, string][]) => {
    const filtered = newRows.filter(([k]) => k.trim());
    const base = url.split("?")[0];
    const qs = filtered.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
    onUrlChange(qs ? `${base}?${qs}` : base);
  };

  const updateRow = (i: number, key: string, val: string) => {
    const n = rows.map((r, idx) => idx === i ? [key, val] as [string, string] : r);
    // auto-add blank row if last row got filled
    const last = n[n.length - 1];
    if (last[0].trim() || last[1].trim()) n.push(["", ""]);
    setRows(n);
    syncUrl(n);
  };

  const deleteRow = (i: number) => {
    const n = rows.filter((_, idx) => idx !== i);
    if (!n.length) n.push(["", ""]);
    setRows(n);
    syncUrl(n);
  };

  return (
    <div className="flex flex-col h-full gap-2 overflow-y-auto custom-scrollbar">
      {rows.map(([k, v], i) => (
        <div key={i} className="flex items-center gap-3">
          <GlassInput value={k} onChange={e => updateRow(i, e.target.value, v)} placeholder="Add URL Parameter" className="flex-1" />
          <span className="text-slate-400 text-sm font-medium flex-shrink-0">=</span>
          <GlassInput value={v} onChange={e => updateRow(i, k, e.target.value)} placeholder="Add Value" className="flex-1" />
          <DeleteBtn onClick={() => deleteRow(i)} />
        </div>
      ))}
    </div>
  );
};

// ── Headers tab ───────────────────────────────────────────────────────────────
const COMMON_HEADERS = ["Content-Type", "Authorization", "Accept", "X-API-Key", "Cache-Control", "User-Agent"];
const HeadersTab: React.FC<{ headers: Record<string, string>; onChange: (h: Record<string, string>) => void }> = ({ headers, onChange }) => {
  const entries = Object.entries(headers).filter(([k]) => k.trim());
  const [rows, setRows] = useStateR<[string, string][]>([...entries, ["", ""]]);

  React.useEffect(() => {
    setRows([...Object.entries(headers).filter(([k]) => k.trim()), ["", ""]]);
  }, [headers]);

  const sync = (newRows: [string, string][]) => {
    const filtered = newRows.filter(([k]) => k.trim());
    onChange(Object.fromEntries(filtered.map(([k, v]) => [k.trim(), v.trim()])));
  };

  const updateRow = (i: number, key: string, val: string) => {
    const n = rows.map((r, idx) => idx === i ? [key, val] as [string, string] : r);
    const last = n[n.length - 1];
    if (last[0].trim() || last[1].trim()) n.push(["", ""]);
    setRows(n);
    sync(n);
  };

  const deleteRow = (i: number) => {
    const n = rows.filter((_, idx) => idx !== i);
    if (!n.length) n.push(["", ""]);
    setRows(n);
    sync(n);
  };

  return (
    <div className="flex flex-col h-full gap-2 overflow-y-auto custom-scrollbar">
      <datalist id="hdr-keys">{COMMON_HEADERS.map(h => <option key={h} value={h} />)}</datalist>
      {rows.map(([k, v], i) => (
        <div key={i} className="flex items-center gap-3">
          <GlassInput list="hdr-keys" value={k} onChange={e => updateRow(i, e.target.value, v)} placeholder="Header name" className="flex-1" />
          <span className="text-slate-400 text-sm font-medium flex-shrink-0">=</span>
          <GlassInput value={v} onChange={e => updateRow(i, k, e.target.value)} placeholder="Value" className="flex-1" />
          <DeleteBtn onClick={() => deleteRow(i)} />
        </div>
      ))}
    </div>
  );
};

// ── Body tab ──────────────────────────────────────────────────────────────────
const BODY_TYPES: { value: BodyType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "text", label: "Text" },
  { value: "json", label: "JSON" },
];

const BodyTab: React.FC<{
  body: string; bodyType: BodyType; variables: Record<string, string>;
  onBodyChange: (b: string) => void; onBodyTypeChange: (t: BodyType) => void;
  onVariablesChange: (v: Record<string, string>) => void;
  prettyBody: boolean; onPrettifyToggle: () => void; bodyIsJson: boolean; cfg: typeof METHOD_CONFIG[string];
}> = ({ body, bodyType, variables, onBodyChange, onBodyTypeChange, onVariablesChange, prettyBody, onPrettifyToggle, bodyIsJson, cfg }) => {
  const [showVars, setShowVars] = useStateR(false);
  const varEntries = Object.entries(variables).filter(([k]) => k.trim());
  const [varRows, setVarRows] = useStateR<[string, string][]>([...varEntries, ["", ""]]);

  React.useEffect(() => {
    setVarRows([...Object.entries(variables).filter(([k]) => k.trim()), ["", ""]]);
  }, [variables]);

  const syncVars = (rows: [string, string][]) => {
    const f = rows.filter(([k]) => k.trim());
    onVariablesChange(Object.fromEntries(f.map(([k, v]) => [k.trim(), v.trim()])));
  };

  const updateVar = (i: number, key: string, val: string) => {
    const n = varRows.map((r, idx) => idx === i ? [key, val] as [string, string] : r);
    if ((n[n.length - 1][0] || n[n.length - 1][1])) n.push(["", ""]);
    setVarRows(n);
    syncVars(n);
  };

  const deleteVar = (i: number) => {
    const n = varRows.filter((_, idx) => idx !== i);
    if (!n.length) n.push(["", ""]);
    setVarRows(n);
    syncVars(n);
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Body type toggle + prettify */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(148,163,184,0.08)" }}>
          {BODY_TYPES.map(({ value, label }) => (
            <button key={value} type="button" onClick={() => onBodyTypeChange(value)}
              className="px-3 py-1 rounded-md text-xs font-medium transition-all duration-150 focus:outline-none"
              style={bodyType === value ? {
                color: cfg.color, background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                boxShadow: `0 0 8px ${cfg.color}30`,
              } : { color: "rgba(148,163,184,0.6)", background: "transparent", border: "1px solid transparent" }}>
              {label}
            </button>
          ))}
        </div>

        {bodyType === "json" && (
          <button type="button" onClick={onPrettifyToggle} disabled={!bodyIsJson}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 focus:outline-none"
            style={bodyIsJson ? {
              color: prettyBody ? cfg.color : "rgba(148,163,184,0.5)",
              background: prettyBody ? cfg.bg : "rgba(15,23,42,0.3)",
              border: `1px solid ${prettyBody ? cfg.border : "rgba(148,163,184,0.08)"}`,
            } : { color: "rgba(148,163,184,0.2)", background: "transparent", border: "1px solid transparent", cursor: "not-allowed" }}>
            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none">
              <path d="M5 3H4a1 1 0 00-1 1v2.5a1 1 0 01-1 1 1 1 0 011 1V11a1 1 0 001 1h1M11 3h1a1 1 0 011 1v2.5a1 1 0 001 1 1 1 0 00-1 1V11a1 1 0 01-1 1h-1"
                stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Prettify
          </button>
        )}

        <button type="button" onClick={() => setShowVars(v => !v)}
          className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 focus:outline-none"
          style={{
            color: showVars ? "rgba(34,211,238,0.8)" : "rgba(148,163,184,0.4)",
            background: showVars ? "rgba(34,211,238,0.06)" : "transparent",
            border: `1px solid ${showVars ? "rgba(34,211,238,0.2)" : "rgba(148,163,184,0.08)"}`,
          }}>
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
            <path d="M1 6h2M4 3h2M4 9h2M7 6h2M9.5 3.5v5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          Variables
        </button>
      </div>

      {/* Body textarea */}
      {bodyType !== "none" && (
        <textarea value={body} onChange={e => onBodyChange(e.target.value)} rows={12} spellCheck={false}
          placeholder={bodyType === "json" ? '{\n  "key": "value"\n}\n\nUse {{varName}} for variables' : "Plain text. Use {{varName}} for variables"}
          className="h-full w-full rounded-xl text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none resize-none transition-all duration-200 custom-scrollbar"
          style={{
            background: "rgba(8,14,28,0.7)", backdropFilter: "blur(12px)",
            border: "1px solid rgba(148,163,184,0.1)",
            boxShadow: "inset 0 2px 8px rgba(0,0,0,0.4)",
            padding: "10px 12px",
            lineHeight: "1.6",
          }}
          onFocus={e => { e.currentTarget.style.borderColor = cfg.border; e.currentTarget.style.boxShadow = `inset 0 2px 8px rgba(0,0,0,0.4), ${cfg.glow}`; }}
          onBlur={e => { e.currentTarget.style.borderColor = "rgba(148,163,184,0.1)"; e.currentTarget.style.boxShadow = "inset 0 2px 8px rgba(0,0,0,0.4)"; }}
        />
      )}

      {/* Variables panel */}
      {showVars && (
        <div className="rounded-xl p-3 space-y-1.5" style={{
          background: "rgba(8,14,28,0.6)", border: "1px solid rgba(34,211,238,0.12)",
          boxShadow: "inset 0 1px 0 rgba(34,211,238,0.06)",
        }}>
          <p className="text-[0.65rem] text-slate-500 mb-2 flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded font-mono" style={{ background: "rgba(34,211,238,0.08)", color: "rgba(34,211,238,0.7)", border: "1px solid rgba(34,211,238,0.15)" }}>{"{{varName}}"}</span>
            in body text will be substituted
          </p>
          {varRows.map(([k, v], i) => (
            <div key={i} className="flex items-center gap-2">
              <GlassInput value={k} onChange={e => updateVar(i, e.target.value, v)} placeholder="Variable name" className="flex-1" />
              <span className="text-slate-500 text-xs flex-shrink-0">=</span>
              <GlassInput value={v} onChange={e => updateVar(i, k, e.target.value)} placeholder="Value" className="flex-1" />
              <DeleteBtn onClick={() => deleteVar(i)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Tab bar ───────────────────────────────────────────────────────────────────
type Tab = "params" | "headers" | "body";
const TABS: { id: Tab; label: string }[] = [
  { id: "params",  label: "URL Params" },
  { id: "headers", label: "Headers"    },
  { id: "body",    label: "Body"       },
];

const TabBar: React.FC<{
  active: Tab; onChange: (t: Tab) => void; cfg: typeof METHOD_CONFIG[string];
  headerCount: number; paramCount: number; bodySet: boolean;
}> = ({ active, onChange, cfg, headerCount, paramCount, bodySet }) => {
  const badge = (n: number | boolean, tab: Tab) => {
    if (!n) return null;
    const isActive = active === tab;
    const count = typeof n === "number" ? n : null;
    return (
      <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[0.6rem] font-bold leading-none"
        style={{
          background: isActive ? cfg.bg : "rgba(148,163,184,0.08)",
          color: isActive ? cfg.color : "rgba(148,163,184,0.5)",
          border: `1px solid ${isActive ? cfg.border : "transparent"}`,
        }}>
        {count ?? "•"}
      </span>
    );
  };

  return (
    <div className="flex items-stretch" style={{
      borderBottom: "1px solid rgba(148,163,184,0.08)",
    }}>
      {TABS.map(({ id, label }) => {
        const isActive = active === id;
        return (
          <button key={id} type="button" onClick={() => onChange(id)}
            className="relative flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-medium transition-all duration-150 focus:outline-none"
            style={{ color: isActive ? cfg.color : "rgba(148,163,184,0.45)" }}>
            {label}
            {id === "headers" && badge(headerCount, "headers")}
            {id === "params"  && badge(paramCount,  "params")}
            {id === "body"    && badge(bodySet,      "body")}
            {/* Active underline */}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} />
            )}
          </button>
        );
      })}
    </div>
  );
};

// ── Main RequestForm ──────────────────────────────────────────────────────────
const RequestForm: React.FC<{ selectedId: string | null; setAIExplanation: (s: string) => void }> = ({ selectedId: _selectedId, setAIExplanation }) => {
  const dispatch = useDispatch();
  const { method, setMethod, url, setUrl, headers, setHeaders, body, setBody, activity } = useRequestFormState();

  const [tab,       setTab]       = useStateR<Tab>("params");
  const [bodyType,  setBodyType]  = useStateR<BodyType>("json");
  const [variables, setVariables] = useStateR<Record<string, string>>({});
  const [isSending, setIsSending] = useStateR(false);
  const [prettyBody, setPrettyBody] = useStateR(false);
  const prevRequestRef = React.useRef<string>("");
  const cfg = getCfg(method);
  const bodyIsJson = bodyType === "json" && isValidJson(body);

  React.useEffect(() => { if (bodyType !== "json") setPrettyBody(false); }, [bodyType]);
  React.useEffect(() => { if (!bodyIsJson) setPrettyBody(false); }, [bodyIsJson]);

  const displayBody = React.useMemo(() => {
    if (prettyBody && bodyIsJson) { try { return JSON.stringify(JSON.parse(body), null, 2); } catch { return body; } }
    return body;
  }, [prettyBody, bodyIsJson, body]);

  const handlePrettifyToggle = () => {
    if (!bodyIsJson) return;
    if (!prettyBody) { try { setBody(JSON.stringify(JSON.parse(body), null, 2)); } catch {} }
    setPrettyBody(v => !v);
  };

  React.useEffect(() => {
    if (!activity?.id) return;
    const t = setTimeout(() => {
      const nextReq = { ...activity.request, method, url, headers, body: bodyType === "none" ? "" : body };
      const s = JSON.stringify(nextReq);
      if (s === prevRequestRef.current) return;
      prevRequestRef.current = s;
      dispatch(updateActivity({ id: activity.id, data: { url, request: nextReq } }));
    }, 300);
    return () => clearTimeout(t);
  }, [method, url, headers, body, bodyType, activity, dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const substituted = bodyType !== "none" ? substituteVariables(body, variables) : "";
    if (bodyType === "json" && substituted.trim()) {
      try { JSON.parse(substituted); } catch { alert("Body must be valid JSON"); return; }
    }
    if (activity?.id) {
      dispatch(updateActivity({ id: activity.id, data: { url, request: { ...activity.request, method, url, headers, body: bodyType === "none" ? "" : body } } }));
    }
    setIsSending(true);
    try {
      await networkUtils.sendHttpRequest({ method, url, headers, body: substituted }, activity?.id, activity?.name, dispatch as any, setAIExplanation);
    } finally { setIsSending(false); }
  };

  const headerCount = Object.keys(headers).filter(k => k.trim()).length;
  const paramCount  = (() => { try { const i = url.indexOf("?"); return i === -1 ? 0 : url.slice(i+1).split("&").filter(p => p.trim()).length; } catch { return 0; } })();
  const bodySet     = bodyType !== "none" && body.trim().length > 0;

  return (
    <form className="tour-request-form flex flex-col gap-3 h-full overflow-hidden" onSubmit={handleSubmit}>

      {/* ── Method + URL row ── */}
      <div className="flex items-center gap-2">
        <MethodSelect method={method} onChange={m => setMethod(m as RequestMethod)} />
        <UrlInput url={url} onChange={setUrl} method={method} />
        {/* Send button inline with URL */}
        <button type="submit" disabled={isSending}
          className="relative flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all duration-200 focus:outline-none overflow-hidden group"
          style={{
            color: cfg.color,
            background: `linear-gradient(135deg, ${cfg.bg}, rgba(15,23,42,0.65))`,
            backdropFilter: "blur(16px) saturate(180%)", WebkitBackdropFilter: "blur(16px) saturate(180%)",
            border: `1px solid ${cfg.border}`,
            boxShadow: isSending ? "inset 0 1px 0 rgba(255,255,255,0.05)" : `${cfg.glassGlow}, 0 4px 16px rgba(0,0,0,0.3)`,
            letterSpacing: "0.08em", minWidth: 80,
            opacity: isSending ? 0.6 : 1,
          }}
          onMouseEnter={e => { if (!isSending) e.currentTarget.style.boxShadow = `0 0 28px ${cfg.color}40, inset 0 1px 0 rgba(255,255,255,0.1), 0 6px 20px rgba(0,0,0,0.4)`; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = `${cfg.glassGlow}, 0 4px 16px rgba(0,0,0,0.3)`; }}>
          <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{ background: `linear-gradient(105deg, transparent 35%, ${cfg.color}12 50%, transparent 65%)` }} />
          {isSending
            ? <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
            : <svg className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5" viewBox="0 0 16 16" fill="none"><path d="M2 8h10M9 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          <span>{isSending ? "Sending…" : "Send"}</span>
        </button>
      </div>

      {/* ── Tab panel ── */}
      <div className="rounded-xl flex flex-col flex-1 min-h-0 overflow-hidden"
        style={{
          background: "rgba(8,14,28,0.55)",
          backdropFilter: "blur(20px) saturate(160%)", WebkitBackdropFilter: "blur(20px) saturate(160%)",
          border: "1px solid rgba(148,163,184,0.08)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.3)",
        }}>

        {/* Tab bar */}
        <TabBar active={tab} onChange={setTab} cfg={cfg}
          headerCount={headerCount} paramCount={paramCount} bodySet={bodySet} />

        {/* Tab content */}
        <div className="px-4 py-4 flex-1 flex flex-col min-h-0">
          {tab === "params"  && <UrlParamsTab url={url} onUrlChange={setUrl} />}
          {tab === "headers" && <HeadersTab headers={headers} onChange={setHeaders} />}
          {tab === "body"    && (
            <BodyTab
              body={displayBody} bodyType={bodyType} variables={variables}
              onBodyChange={setBody} onBodyTypeChange={setBodyType} onVariablesChange={setVariables}
              prettyBody={prettyBody} onPrettifyToggle={handlePrettifyToggle}
              bodyIsJson={bodyIsJson} cfg={cfg}
            />
          )}
        </div>
      </div>


    </form>
  );
};

export default RequestForm;