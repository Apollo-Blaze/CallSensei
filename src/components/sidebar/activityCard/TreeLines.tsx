import React from "react";

const ACTIVE_LINE   = "rgba(34,211,238,0.45)";
const INACTIVE_LINE = "rgba(148,163,184,0.15)";

/** Wraps a folder's children with a vertical guide line on the left. */
export const TreeChildren: React.FC<{ isActive: boolean; children: React.ReactNode }> = ({ isActive, children }) => (
  <div className="relative">
    <div
      className="absolute transition-colors duration-300"
      style={{ left: 10, top: 0, bottom: 6, width: 1, borderRadius: 2, background: isActive ? ACTIVE_LINE : INACTIVE_LINE }}
    />
    <div className="pl-5">{children}</div>
  </div>
);

/** Wraps a single child item with a short horizontal connector back to the vertical line. */
export const ChildRow: React.FC<{ isActive: boolean; children: React.ReactNode }> = ({ isActive, children }) => (
  <div className="relative">
    <div
      className="absolute transition-colors duration-300"
      style={{ left: -15, top: "50%", width: 10, height: 1, transform: "translateY(-50%)", background: isActive ? ACTIVE_LINE : INACTIVE_LINE }}
    />
    {children}
  </div>
);