import React, { useRef, useEffect } from "react";
import { CheckIcon, CrossIcon } from "./Icons";

interface InlineEditInputProps {
  value: string;
  onChange: (v: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}

/** Glass text input with confirm ✓ and cancel ✗ buttons.
 *  Used by both ActivityName and FolderName. */
const InlineEditInput: React.FC<InlineEditInputProps> = ({ value, onChange, onCommit, onCancel }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") onCommit();
    else if (e.key === "Escape") onCancel();
  };

  return (
    <div className="flex items-center gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
      <input
        ref={inputRef}
        className="flex-1 min-w-0 text-xs font-semibold text-white rounded-md px-1.5 py-0.5 focus:outline-none"
        style={{
          background: "rgba(15,23,42,0.7)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(34,211,238,0.4)",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.4), 0 0 8px rgba(34,211,238,0.1)",
        }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onCommit}
        onKeyDown={handleKeyDown}
      />

      <button type="button" onClick={onCommit} title="Save (Enter)"
        className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-md focus:outline-none"
        style={{ background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.3)", color: "#22d3ee" }}>
        <CheckIcon />
      </button>

      <button type="button" onClick={onCancel} title="Cancel (Esc)"
        className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-md focus:outline-none"
        style={{ background: "rgba(148,163,184,0.06)", border: "1px solid rgba(148,163,184,0.15)", color: "rgba(148,163,184,0.7)" }}>
        <CrossIcon />
      </button>
    </div>
  );
};

export default InlineEditInput;