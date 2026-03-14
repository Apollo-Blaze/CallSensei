import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../state/store";
import type { ActivityModel } from "../../models/ActivityModel";

function getStatusConfig(status: number) {
  if (status >= 500) return { color: "#f87171", glow: "0 0 16px rgba(248,113,113,0.4)", bg: "rgba(248,113,113,0.07)", border: "rgba(248,113,113,0.22)", glassGlow: "0 0 24px rgba(248,113,113,0.2), inset 0 1px 0 rgba(255,255,255,0.07)", label: "Server Error" };
  if (status >= 400) return { color: "#fb923c", glow: "0 0 16px rgba(251,146,60,0.4)",  bg: "rgba(251,146,60,0.07)",  border: "rgba(251,146,60,0.22)",  glassGlow: "0 0 24px rgba(251,146,60,0.2),  inset 0 1px 0 rgba(255,255,255,0.07)", label: "Client Error" };
  if (status >= 300) return { color: "#f59e0b", glow: "0 0 16px rgba(245,158,11,0.4)",  bg: "rgba(245,158,11,0.07)",  border: "rgba(245,158,11,0.22)",  glassGlow: "0 0 24px rgba(245,158,11,0.2),  inset 0 1px 0 rgba(255,255,255,0.07)", label: "Redirect" };
  if (status >= 200) return { color: "#34d399", glow: "0 0 16px rgba(52,211,153,0.4)",  bg: "rgba(52,211,153,0.07)",  border: "rgba(52,211,153,0.22)",  glassGlow: "0 0 24px rgba(52,211,153,0.2),  inset 0 1px 0 rgba(255,255,255,0.07)", label: "Success" };
  if (status >= 100) return { color: "#60a5fa", glow: "0 0 16px rgba(96,165,250,0.4)",  bg: "rgba(96,165,250,0.07)",  border: "rgba(96,165,250,0.22)",  glassGlow: "0 0 24px rgba(96,165,250,0.2),  inset 0 1px 0 rgba(255,255,255,0.07)", label: "Informational" };
  return                   { color: "#94a3b8", glow: "0 0 16px rgba(148,163,184,0.3)", bg: "rgba(148,163,184,0.07)", border: "rgba(148,163,184,0.20)", glassGlow: "0 0 20px rgba(148,163,184,0.15), inset 0 1px 0 rgba(255,255,255,0.06)", label: "Unknown" };
}

function formatDuration(ms: number) {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
}

// ── Glass pre block ───────────────────────────────────────────────────────────
const GlassPre: React.FC<{
  children: string;
  maxHeight?: string;
  accentColor?: string;
}> = ({ children, maxHeight = "12rem", accentColor }) => (
  <div className="relative">
    {accentColor && (
      <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full z-10"
        style={{ background: accentColor, opacity: 0.45, boxShadow: `0 0 6px ${accentColor}` }} />
    )}
    <pre
      className="custom-scrollbar w-full max-w-full overflow-y-auto overflow-x-hidden pl-4 pr-3 py-3 rounded-xl text-[0.72rem] text-slate-300 leading-relaxed whitespace-pre-wrap break-all"
      style={{
        maxHeight,
        background: "rgba(2,6,23,0.65)",
        backdropFilter: "blur(16px) saturate(150%)",
        WebkitBackdropFilter: "blur(16px) saturate(150%)",
        border: "1px solid rgba(148,163,184,0.09)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), inset 0 2px 12px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.25)",
      }}
    >
      {children}
    </pre>
  </div>
);

// ── Prettify button ───────────────────────────────────────────────────────────
const PrettifyButton: React.FC<{
  enabled: boolean; active: boolean; onToggle: () => void;
  color: string; bg: string; border: string; glassGlow: string;
}> = ({ enabled, active, onToggle, color, bg, border, glassGlow }) => (
  <button
    type="button"
    onClick={onToggle}
    disabled={!enabled}
    title={!enabled ? "Available for JSON" : active ? "Prettify on" : "Prettify JSON"}
    className="relative flex items-center gap-1.5 px-3 py-1 rounded-lg text-[0.7rem] font-bold tracking-wide uppercase transition-all duration-200 focus:outline-none overflow-hidden group"
    style={
      enabled
        ? {
            color: active ? color : "#64748b",
            background: active ? `linear-gradient(135deg, ${bg}, rgba(15,23,42,0.5))` : "rgba(15,23,42,0.35)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: `1px solid ${active ? border : "rgba(148,163,184,0.1)"}`,
            boxShadow: active
              ? `${glassGlow}, 0 2px 8px rgba(0,0,0,0.2)`
              : "inset 0 1px 0 rgba(255,255,255,0.05), 0 2px 6px rgba(0,0,0,0.15)",
            letterSpacing: "0.08em",
          }
        : { color: "#475569", border: "1px solid rgba(30,41,59,0.6)", background: "rgba(15,23,42,0.2)", cursor: "not-allowed", opacity: 0.3 }
    }
  >
    <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
      style={{ background: `linear-gradient(105deg, transparent 35%, ${color}0e 50%, transparent 65%)` }} />
    <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 16 16" fill="none">
      <path d="M4 5h8M4 8h5M4 11h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
    Prettify: {active ? "On" : "Off"}
  </button>
);

// ── ResponseViewer ────────────────────────────────────────────────────────────
const ResponseViewer: React.FC = () => {
  const selectedActivityId = useSelector((state: RootState) => state.activities.selectedActivityId);
  const activities = useSelector((state: RootState) => state.activities.activities);
  const selectedActivity = activities.find((a: ActivityModel) => a.id === selectedActivityId);
  const [pretty, setPretty] = React.useState(true);

  if (!selectedActivity || !selectedActivity.response) {
    return (
      <div className="min-w-0 flex flex-col flex-1">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white tracking-wide">Response</h3>
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.68rem] text-slate-400 font-mono"
            style={{
              background: "rgba(15,23,42,0.5)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(148,163,184,0.1)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse" />
            Waiting…
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-500">No response yet. Send a request to see status, headers, and body here.</p>
      </div>
    );
  }

  const response = selectedActivity.response;
  const sc = getStatusConfig(response.status ?? 0);
  const contentType = response.contentType || response.headers?.["content-type"] || response.headers?.["Content-Type"] || "";
  const isProbablyJson = contentType.toLowerCase().includes("json") || (response.body ?? "").trim().startsWith("{") || (response.body ?? "").trim().startsWith("[");
  const formattedBody = (() => {
    if (!pretty || !isProbablyJson) return response.body ?? "";
    try { return JSON.stringify(JSON.parse(response.body), null, 2); } catch { return response.body ?? ""; }
  })();
  const headerCount = Object.keys(response.headers || {}).length;
  const duration: number | undefined = (response as any).duration ?? (response as any).timeTaken ?? (response as any).elapsed;

  return (
    <div className="min-w-0 w-full flex flex-col flex-1 overflow-hidden gap-4">

      {/* ── Title row ── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white tracking-wide flex-shrink-0">Response</h3>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status badge — glass with status colour */}
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold font-mono tracking-wide transition-all duration-300"
            style={{
              color: sc.color,
              background: `linear-gradient(135deg, ${sc.bg}, rgba(15,23,42,0.6))`,
              backdropFilter: "blur(16px) saturate(180%)",
              WebkitBackdropFilter: "blur(16px) saturate(180%)",
              border: `1px solid ${sc.border}`,
              boxShadow: `${sc.glassGlow}, 0 2px 10px rgba(0,0,0,0.3)`,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sc.color, boxShadow: sc.glow }} />
            {response.status} {response.statusText}
          </span>

          {/* Duration badge */}
          {duration !== undefined && (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono"
              style={{
                color: "#94a3b8",
                background: "rgba(15,23,42,0.45)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(148,163,184,0.12)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              <svg className="w-3 h-3 opacity-50" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
                <path d="M8 5v3.5l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              {formatDuration(duration)}
            </span>
          )}

          {/* Content-type */}
          {contentType && (
            <span
              className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-xl text-[0.68rem] text-slate-400 font-mono truncate max-w-[140px]"
              style={{
                background: "rgba(15,23,42,0.45)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(148,163,184,0.1)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
              {contentType.split(";")[0]}
            </span>
          )}
        </div>
      </div>

      {/* ── Headers ── */}
      <section className="min-w-0 w-full overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest" style={{ letterSpacing: "0.1em" }}>
            Headers
          </span>
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-lg text-[0.68rem] font-mono"
            style={{
              color: sc.color,
              background: `linear-gradient(135deg, ${sc.bg}, rgba(15,23,42,0.4))`,
              backdropFilter: "blur(8px)",
              border: `1px solid ${sc.border}`,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            {headerCount} {headerCount === 1 ? "key" : "keys"}
          </span>
        </div>
        <GlassPre maxHeight="12rem" accentColor={sc.color}>
          {JSON.stringify(response.headers, null, 2)}
        </GlassPre>
      </section>

      {/* ── Body ── */}
      <section className="min-w-0 w-full overflow-hidden">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest" style={{ letterSpacing: "0.1em" }}>
            Body
          </span>
          <PrettifyButton
            enabled={isProbablyJson}
            active={pretty}
            onToggle={() => setPretty((v) => !v)}
            color={sc.color}
            bg={sc.bg}
            border={sc.border}
            glassGlow={sc.glassGlow}
          />
        </div>
        <GlassPre maxHeight="52vh" accentColor={sc.color}>
          {formattedBody}
        </GlassPre>
      </section>

    </div>
  );
};

export default ResponseViewer;