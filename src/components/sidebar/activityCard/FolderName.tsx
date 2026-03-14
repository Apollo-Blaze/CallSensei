import React, { useState } from "react";
import type { FolderModel } from "../../../models/FolderModel";
import InlineEditInput from "./InlineEdit";
import { FolderIcon, PencilIcon } from "./Icons";

interface FolderNameProps {
  folder: FolderModel;
  onCommit: (id: string, name: string) => void;
  onDragStart: (e: React.DragEvent) => void;
}

const FolderName: React.FC<FolderNameProps> = ({ folder, onCommit, onDragStart }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(folder.name);

  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(folder.name);
    setIsEditing(true);
  };

  const commit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== folder.name) onCommit(folder.id, trimmed);
    setIsEditing(false);
  };

  const cancel = () => { setIsEditing(false); setEditValue(folder.name); };

  if (isEditing) {
    return <InlineEditInput value={editValue} onChange={setEditValue} onCommit={commit} onCancel={cancel} />;
  }

  return (
    <span draggable onDragStart={onDragStart} className="flex items-center gap-1.5 flex-1 min-w-0 group/fname">
      <FolderIcon />
      <span
        className="truncate text-xs font-semibold text-slate-300 group-hover/fname:text-slate-100 transition-colors cursor-text"
        title={`${folder.name} — double-click to rename`}
        onDoubleClick={startEditing}
      >
        {folder.name}
      </span>
      <button type="button" onClick={startEditing} title="Rename folder"
        className="flex-shrink-0 flex items-center justify-center w-4 h-4 rounded opacity-0 group-hover/fname:opacity-100 transition-all duration-150 focus:outline-none"
        style={{ background: "transparent", border: "1px solid transparent", color: "rgba(148,163,184,0.4)" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(148,163,184,0.1)"; e.currentTarget.style.borderColor = "rgba(148,163,184,0.2)"; e.currentTarget.style.color = "#e2e8f0"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.color = "rgba(148,163,184,0.4)"; }}
      >
        <PencilIcon />
      </button>
    </span>
  );
};

export default FolderName;