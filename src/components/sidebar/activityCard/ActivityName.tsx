import React, { useState } from "react";
import InlineEditInput from "./InlineEdit";
import { PencilIcon } from "./Icons";

interface ActivityNameProps {
  activityId: string;
  name: string;
  onRename: (id: string, newName: string) => void;
}

const ActivityName: React.FC<ActivityNameProps> = ({ activityId, name, onRename }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);

  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(name);
    setIsEditing(true);
  };

  const commit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== name) onRename(activityId, trimmed);
    setIsEditing(false);
  };

  const cancel = () => { setIsEditing(false); setEditValue(name); };

  if (isEditing) {
    return <InlineEditInput value={editValue} onChange={setEditValue} onCommit={commit} onCancel={cancel} />;
  }

  return (
    <div className="flex items-center gap-1 w-full min-w-0 group/name">
      <span
        className="flex-1 min-w-0 truncate text-[0.78rem] font-semibold leading-snug cursor-text select-none"
        title={`${name} — double-click to rename`}
        onDoubleClick={startEditing}
      >
        {name}
      </span>
      <button type="button" onClick={startEditing} title="Rename"
        className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-md opacity-0 group-hover/name:opacity-100 transition-all duration-150 focus:outline-none"
        style={{ background: "transparent", border: "1px solid transparent", color: "rgba(148,163,184,0.5)" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(148,163,184,0.1)"; e.currentTarget.style.borderColor = "rgba(148,163,184,0.2)"; e.currentTarget.style.color = "#e2e8f0"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.color = "rgba(148,163,184,0.5)"; }}
      >
        <PencilIcon />
      </button>
    </div>
  );
};

export default ActivityName;