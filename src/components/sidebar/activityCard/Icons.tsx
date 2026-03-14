import React from "react";

export const CheckIcon = () => (
  <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
    <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CrossIcon = () => (
  <svg width="8" height="8" viewBox="0 0 9 9" fill="none">
    <path d="M1.5 1.5l6 6M7.5 1.5l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const PencilIcon = () => (
  <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
    <path d="M8.5 1.5a1.414 1.414 0 012 2L3.5 10.5l-3 .5.5-3 7.5-6.5z"
      stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ChevronIcon = ({ rotated }: { rotated: boolean }) => (
  <svg
    className="w-2.5 h-2.5 transition-transform duration-200"
    style={{ transform: rotated ? "rotate(-90deg)" : "rotate(0deg)" }}
    viewBox="0 0 10 10" fill="none"
  >
    <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const FolderIcon = () => (
  <svg className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" viewBox="0 0 16 16" fill="none">
    <path d="M2 5a1 1 0 011-1h3.586a1 1 0 01.707.293L8.414 5.4A1 1 0 009.12 5.7H13a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V5z"
      stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.12" />
  </svg>
);

export const TrashIcon = ({ size = 3 }: { size?: number }) => (
  <svg className={`w-${size} h-${size}`} viewBox="0 0 12 12" fill="none">
    <path d="M2 3h8M5 3V2h2v1M4 3v7h4V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const PushIcon = () => (
  <svg className="w-2.5 h-2.5 flex-shrink-0" viewBox="0 0 12 12" fill="none">
    <path d="M6 7.5V1.5M6 1.5L3.5 4M6 1.5L8.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M1.5 9.5h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

export const CopyIcon = () => (
  <svg className="w-3 h-3 opacity-60 flex-shrink-0" viewBox="0 0 14 14" fill="none">
    <rect x="4" y="4" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
    <path d="M2.5 9.5V3a.5.5 0 01.5-.5h6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const DeleteMenuIcon = () => (
  <svg className="w-3 h-3 opacity-70 flex-shrink-0" viewBox="0 0 14 14" fill="none">
    <path d="M2.5 4h9M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <rect x="3" y="4" width="8" height="8.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);