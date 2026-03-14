import React, { useState, useRef, useCallback } from "react";
import Navbar from "./Navbar";
import PatchReview from "../ai/PatchReview";
import AIPanel from "../ai/AIPanel";
import RequestForm from "../request/RequestForm";
import ResponseViewer from "../response/ResponseViewer";

interface MainWindowProps {
  selectedId: string | null;
  setAIExplanation: (explanation: string) => void;
  aiExplanation: string;
}

const MIN_PANEL_PCT = 28; // neither panel shrinks below 28% of container width

const MainWindow: React.FC<MainWindowProps> = ({ selectedId, setAIExplanation, aiExplanation }) => {
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [isPatchOpen,   setIsPatchOpen]   = useState(false);
  const [isFloating,    setIsFloating]    = useState(false);

  // Split ratio: left panel width as percentage of the split container
  const [splitPct, setSplitPct] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging     = useRef(false);

  const onDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let pct = ((ev.clientX - rect.left) / rect.width) * 100;
      pct = Math.max(MIN_PANEL_PCT, Math.min(100 - MIN_PANEL_PCT, pct));
      setSplitPct(pct);
    };
    const onMouseUp = () => {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, []);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <Navbar
        onAIClick={() => setIsAIPanelOpen(v => !v)}
        isAIPanelOpen={isAIPanelOpen}
        onPatchClick={() => setIsPatchOpen(v => !v)}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── Split content area ── */}
        <main className="tour-main-content flex-1 min-w-0 flex flex-col overflow-hidden px-3 py-3 sm:px-4 sm:py-4 gap-3">

          {/* ── Side-by-side Request / Response ── */}
          <div ref={containerRef} className="flex flex-1 min-h-0 gap-0 overflow-hidden">

            {/* ── LEFT: Request ── */}
            <div
              className="flex flex-col min-h-0 overflow-hidden"
              style={{ width: `${splitPct}%`, minWidth: 0 }}
            >
              <div
                className="flex-1 min-h-0 flex flex-col overflow-hidden"
                style={{ paddingRight: 6 }}
              >
                <section
                  className="panel-soft border border-slate-700/80 rounded-xl px-4 py-4 min-w-0 flex flex-col flex-1 min-h-0 overflow-hidden"
                >
                  {/* Section label */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase flex items-center gap-1.5">
                      <svg className="w-3 h-3 opacity-60" viewBox="0 0 12 12" fill="none">
                        <path d="M1 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Request
                    </span>
                  </div>
                  <RequestForm selectedId={selectedId} setAIExplanation={setAIExplanation} />
                </section>
              </div>
            </div>

            {/* ── DIVIDER ── */}
            <div
              className="flex-shrink-0 flex items-center justify-center cursor-col-resize group"
              style={{ width: 14, zIndex: 10 }}
              onMouseDown={onDividerMouseDown}
            >
              <div
                className="h-full w-0.5 transition-all duration-150 group-hover:w-1"
                style={{
                  background: "rgba(148,163,184,0.12)",
                  boxShadow: "0 0 0 1px rgba(148,163,184,0.06)",
                  borderRadius: 2,
                }}
              />
              {/* Drag handle dots */}
              <div className="absolute flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1 h-1 rounded-full" style={{ background: "rgba(148,163,184,0.5)" }} />
                ))}
              </div>
            </div>

            {/* ── RIGHT: Response ── */}
            <div
              className="flex flex-col min-h-0 overflow-hidden"
              style={{ width: `${100 - splitPct}%`, minWidth: 0 }}
            >
              <div
                className="flex-1 min-h-0 flex flex-col overflow-hidden"
                style={{ paddingLeft: 6 }}
              >
                <section
                  className="panel-soft border border-slate-700/80 rounded-xl px-4 py-4 min-w-0 flex flex-col flex-1 min-h-0 overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase flex items-center gap-1.5">
                      <svg className="w-3 h-3 opacity-60" viewBox="0 0 12 12" fill="none">
                        <path d="M11 6H3M5 3L2 6l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Response
                    </span>
                  </div>
                  <ResponseViewer />
                </section>
              </div>
            </div>
          </div>

          {/* ── Patch review (optional, below both panels) ── */}
          {isPatchOpen && (
            <section className="panel-soft border border-slate-700/80 rounded-xl px-4 py-4 flex-shrink-0 min-w-0">
              <PatchReview />
            </section>
          )}
        </main>

        {/* ── AI Panel ── */}
        <AIPanel
          isOpen={isAIPanelOpen}
          onClose={() => setIsAIPanelOpen(false)}
          explanation={aiExplanation}
          onSetExplanation={setAIExplanation}
          selectedId={selectedId}
          isFloating={isFloating}
          onFloatingChange={setIsFloating}
        />
      </div>
    </div>
  );
};

export default MainWindow;