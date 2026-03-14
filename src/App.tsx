import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import Sidebar from "./components/sidebar/Sidebar";
import MainWindow from "./components/window/MainWindow";
import { setSelectedActivity } from "./state/activitiesSlice";
import type { RootState } from "./state/store";

const SIDEBAR_MIN    = 260;   // wider minimum
const SIDEBAR_MAX    = 440;
const SIDEBAR_DEFAULT = 300;
const SIDEBAR_COLLAPSED = 0;

const App: React.FC = () => {
  const dispatch = useDispatch();
  const selectedId = useSelector((state: RootState) => state.activities.selectedActivityId);
  const [aiExplanation, setAIExplanation] = useState("");
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);
  const [collapsed, setCollapsed] = useState(false);

  const isResizing  = useRef(false);
  const startX      = useRef(0);
  const startWidth  = useRef(SIDEBAR_DEFAULT);

  const handleSelect = (id: string) => dispatch(setSelectedActivity(id));

  const handleCollapse = () => {
    setCollapsed(true);
  };

  const handleExpand = () => {
    setCollapsed(false);
  };

  // ── Resize drag ─────────────────────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (collapsed) return;
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current = sidebarWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    e.preventDefault();
  }, [sidebarWidth, collapsed]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = e.clientX - startX.current;
      const next = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startWidth.current + delta));
      setSidebarWidth(next);
    };
    const onMouseUp = () => {
      if (!isResizing.current) return;
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const resolvedWidth = collapsed ? 0 : sidebarWidth;

  return (
    <div className="app-shell bg-mesh overflow-hidden">
      <div className="app-shell-inner overflow-hidden" style={{ padding: "0.75rem", gap: 0 }}>

        {/* ── Sidebar ── */}
        <aside
          className="relative flex-shrink-0 h-full overflow-hidden"
          style={{
            width: resolvedWidth,
            minWidth: collapsed ? 0 : SIDEBAR_MIN,
            maxWidth: SIDEBAR_MAX,
            // Animate collapse/expand
            transition: isResizing.current ? "none" : "width 0.22s cubic-bezier(0.4,0,0.2,1)",
            // Glass panel styles inlined so they still apply when not using .panel-soft
            background: "linear-gradient(135deg, rgba(15,23,42,0.55), rgba(15,23,42,0.45))",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: collapsed ? "none" : "1px solid rgba(148,163,184,0.10)",
            borderRadius: "1.25rem",
            boxShadow: collapsed ? "none" : "inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.45)",
          }}
        >
          {/* Sidebar content — hidden when collapsed so it doesn't peek */}
          <div
            className="h-full w-full"
            style={{
              opacity: collapsed ? 0 : 1,
              transition: "opacity 0.15s ease",
              pointerEvents: collapsed ? "none" : "auto",
              minWidth: SIDEBAR_MIN, // prevent content squishing during transition
            }}
          >
            <Sidebar
              onSelect={handleSelect}
              selectedId={selectedId || null}
              onCollapse={handleCollapse}
            />
          </div>

          {/* Resize handle — only when expanded */}
          {!collapsed && (
            <div
              onMouseDown={onMouseDown}
              className="absolute top-0 right-0 h-full w-2 z-50 cursor-col-resize group"
              style={{ touchAction: "none" }}
            >
              <div
                className="absolute inset-y-6 right-0.5 w-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{
                  background: "rgba(34,211,238,0.45)",
                  boxShadow: "0 0 6px rgba(34,211,238,0.35)",
                }}
              />
            </div>
          )}
        </aside>

        {/* Gap */}
        <div
          style={{
            width: collapsed ? 0 : 12,
            flexShrink: 0,
            transition: "width 0.22s cubic-bezier(0.4,0,0.2,1)",
          }}
        />

        {/* ── Main window ── */}
        <section className="panel-strong flex-1 min-w-0 h-full overflow-hidden flex flex-col relative">
          <MainWindow
            selectedId={selectedId || null}
            setAIExplanation={setAIExplanation}
            aiExplanation={aiExplanation}
          />

          {/* Expand tab — appears on left edge of main panel when sidebar is collapsed */}
          {collapsed && (
            <button
              onClick={handleExpand}
              title="Expand sidebar"
              className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-200 focus:outline-none z-40"
              style={{
                width: 20,
                height: 48,
                borderRadius: "0 8px 8px 0",
                background: "rgba(15,23,42,0.7)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(148,163,184,0.14)",
                borderLeft: "none",
                color: "rgba(148,163,184,0.6)",
                boxShadow: "2px 0 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#22d3ee";
                e.currentTarget.style.borderColor = "rgba(34,211,238,0.3)";
                e.currentTarget.style.background = "rgba(34,211,238,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(148,163,184,0.6)";
                e.currentTarget.style.borderColor = "rgba(148,163,184,0.14)";
                e.currentTarget.style.background = "rgba(15,23,42,0.7)";
              }}
            >
              {/* Chevron-right */}
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M3 1.5L7 5l-4 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </section>

      </div>
    </div>
  );
};

export default App;