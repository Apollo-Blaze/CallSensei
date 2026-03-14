import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { activityStyles, activityConstants } from "./ActivityStyles";
import { CopyIcon, DeleteMenuIcon } from "./Icons";

interface ActivityMenuProps {
  activityId: string;
  onDuplicate: () => void;
  onDelete: () => void;
}

const ActivityMenu: React.FC<ActivityMenuProps> = ({ activityId, onDuplicate, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const openMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
    setIsOpen((v) => !v);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node) || triggerRef.current?.contains(e.target as Node)) return;
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = () => setIsOpen(false);
    window.addEventListener("scroll", handler, true);
    return () => window.removeEventListener("scroll", handler, true);
  }, [isOpen]);

  const menuItem = (onClick: () => void, icon: React.ReactNode, label: string, isDanger = false) => (
    <button
      onClick={() => { onClick(); setIsOpen(false); }}
      className={`relative flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs transition-all duration-150 focus:outline-none ${isDanger ? "text-red-400/80" : "text-slate-300"}`}
      style={{ background: "transparent" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = isDanger ? "rgba(248,113,113,0.08)" : "rgba(148,163,184,0.09)"; e.currentTarget.style.color = isDanger ? "#fca5a5" : "#f1f5f9"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = ""; }}
    >
      <span className="flex items-center justify-center w-5 h-5 rounded-md flex-shrink-0"
        style={{ background: isDanger ? "rgba(248,113,113,0.08)" : "rgba(148,163,184,0.08)", border: `1px solid ${isDanger ? "rgba(248,113,113,0.15)" : "rgba(148,163,184,0.12)"}` }}>
        {icon}
      </span>
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className={activityStyles.menu.container}>
      <button ref={triggerRef} className={activityStyles.menu.button} onClick={openMenu} title="More options">
        <span className="text-sm leading-none tracking-tighter">{activityConstants.menuEllipsis}</span>
      </button>

      {isOpen && createPortal(
        <div ref={menuRef} onClick={(e) => e.stopPropagation()} style={{
          position: "fixed", top: coords.top, right: coords.right, width: 148, zIndex: 9999,
          background: "linear-gradient(160deg, rgba(20,28,48,0.92) 0%, rgba(8,12,24,0.96) 100%)",
          backdropFilter: "blur(40px) saturate(180%)", WebkitBackdropFilter: "blur(40px) saturate(180%)",
          border: "1px solid rgba(148,163,184,0.13)", borderRadius: "0.875rem", padding: "5px",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.5), 0 8px 16px rgba(0,0,0,0.4), 0 24px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}>
          <div style={{ position: "absolute", inset: "0 0 auto 0", height: 1, background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />
          {menuItem(onDuplicate, <CopyIcon />, "Duplicate")}
          <div style={{ margin: "3px 8px", height: 1, background: "rgba(148,163,184,0.1)" }} />
          {menuItem(onDelete, <DeleteMenuIcon />, "Delete", true)}
        </div>,
        document.body
      )}
    </div>
  );
};

export default ActivityMenu;