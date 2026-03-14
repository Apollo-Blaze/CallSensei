import React, { useEffect, useRef, useState } from "react";
import { ActivityList } from "./ActivityList";
import GitHubAuthButton from "../window/github/GitHubButton";
import { useDispatch, useSelector } from "react-redux";
import { addActivity, addFolder, setSelectedActivity } from "../../state/activitiesSlice";
import type { RequestModel } from "../../models";

interface SidebarProps {
  onSelect: (id: string) => void;
  selectedId: string | null;
  onCollapse?: () => void;
}

// ── Minimal icon button — matches the classy GitHub auth button aesthetic ──────
const IconBtn: React.FC<{
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}> = ({ onClick, title, children, danger }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className="flex-shrink-0 flex items-center justify-center rounded-lg transition-all duration-200 focus:outline-none"
    style={{
      width: 28,
      height: 28,
      background: "rgba(15,23,42,0.0)",
      border: "1px solid rgba(148,163,184,0.14)",
      color: danger ? "rgba(248,113,113,0.7)" : "rgba(148,163,184,0.7)",
      backdropFilter: "blur(8px)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = danger
        ? "rgba(248,113,113,0.08)"
        : "rgba(148,163,184,0.08)";
      e.currentTarget.style.borderColor = danger
        ? "rgba(248,113,113,0.3)"
        : "rgba(148,163,184,0.28)";
      e.currentTarget.style.color = danger ? "#fca5a5" : "#e2e8f0";
      e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 8px rgba(0,0,0,0.25)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "rgba(15,23,42,0.0)";
      e.currentTarget.style.borderColor = "rgba(148,163,184,0.14)";
      e.currentTarget.style.color = danger ? "rgba(248,113,113,0.7)" : "rgba(148,163,184,0.7)";
      e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.05)";
    }}
  >
    {children}
  </button>
);

// ── Sidebar ───────────────────────────────────────────────────────────────────
const Sidebar: React.FC<SidebarProps> = ({ onSelect, selectedId, onCollapse }) => {
  const dispatch = useDispatch();
  const activities = useSelector((state: any) => state.activities.activities);
  const initialized = useRef(false);
  const previousActivitiesLength = useRef(activities.length);

  useEffect(() => {
    if (!initialized.current && activities.length === 0 && !selectedId) {
      const id = crypto.randomUUID();
      const newReq: RequestModel = {
        id,
        method: "GET",
        url: "",
        headers: {},
        body: "",
        timestamp: new Date().toISOString(),
        name: "New Request",
      };
      dispatch(addActivity({ id, name: "New Request", url: "", request: newReq }));
      initialized.current = true;
    }
  }, [activities.length, dispatch, selectedId]);

  useEffect(() => {
    if (activities.length > 0) {
      const isNew = activities.length > previousActivitiesLength.current;
      if (!selectedId || !activities.find((a: any) => a.id === selectedId) || isNew) {
        const latest = activities[activities.length - 1];
        onSelect(latest.id);
        dispatch(setSelectedActivity(latest.id));
      }
    }
    previousActivitiesLength.current = activities.length;
  }, [activities, selectedId, onSelect, dispatch]);

  const handleNewActivity = () => {
    const id = crypto.randomUUID();
    const newReq: RequestModel = {
      id,
      method: "GET",
      url: "",
      headers: {},
      body: "",
      timestamp: new Date().toISOString(),
      name: "New Request",
    };
    dispatch(addActivity({ id, name: "New Request", url: "", request: newReq }));
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">

      {/* ══ Header ════════════════════════════════════════════════════════════ */}
      <div
        className="flex-shrink-0 px-3 pt-3 pb-3 space-y-2.5"
        style={{ borderBottom: "1px solid rgba(148,163,184,0.08)" }}
      >
        {/* Row 1: Workspace pill + collapse */}
        <div className="flex items-center justify-between">
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[0.6rem] font-bold uppercase"
            style={{
              letterSpacing: "0.14em",
              color: "rgba(34,211,238,0.8)",
              background: "rgba(34,211,238,0.06)",
              border: "1px solid rgba(34,211,238,0.15)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            {/* Dot */}
            <span
              className="w-1 h-1 rounded-full"
              style={{ background: "#22d3ee", boxShadow: "0 0 4px #22d3ee" }}
            />
            Workspace
          </span>

          {/* Collapse button */}
          {onCollapse && (
            <IconBtn onClick={onCollapse} title="Collapse sidebar">
              {/* Chevron-left icon */}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M7.5 2L4 6l3.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </IconBtn>
          )}
        </div>

        {/* Row 2: Title + action buttons */}
        <div className="flex items-center gap-1.5">
          {/*<h2 className="flex-1 min-w-0 text-sm font-semibold text-white tracking-tight truncate leading-none">
            Activities
          </h2>*/}

          {/* New activity */}
          <IconBtn onClick={handleNewActivity} title="New Activity">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </IconBtn>

          {/* New folder */}
          <IconBtn onClick={() => dispatch(addFolder(undefined))} title="New Folder">
            <svg width="13" height="12" viewBox="0 0 13 12" fill="none">
              <path
                d="M1 3.5a1 1 0 011-1h2.836a1 1 0 01.707.293L6.25 3.5H11a1 1 0 011 1V9.5a1 1 0 01-1 1H2a1 1 0 01-1-1V3.5z"
                stroke="currentColor" strokeWidth="1.15" fill="currentColor" fillOpacity="0.08"
              />
            </svg>
          </IconBtn>

          {/* GitHub */}
          <GitHubAuthButton />
        </div>
      </div>

      {/* ══ Activity list ════════════════════════════════════════════════════ */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar px-2 py-2">
        <ActivityList onSelect={onSelect} selectedId={selectedId} />
      </div>
    </div>
  );
};

export default Sidebar;