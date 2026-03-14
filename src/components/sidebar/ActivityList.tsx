import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../state/store";
import { deleteFolder, renameFolder, setSelectedActivity } from "../../state/activitiesSlice";
import type { FolderModel } from "../../models/FolderModel";
import ActivityCard from "./activityCard/ActivityCard";
import FolderName from "./activityCard/FolderName";
import { TreeChildren, ChildRow } from "./activityCard/TreeLines";
import { ChevronIcon, TrashIcon } from "./activityCard/Icons";
import { useFolderTree } from "./activityCard/FolderTree";
import { useDragDrop, type DropIndicator } from "./activityCard/DragDrop";

interface ActivityListProps {
  onSelect: (id: string) => void;
  selectedId: string | null;
}

const DropLine: React.FC<{ active: boolean }> = ({ active }) => (
  <div
    className="transition-opacity duration-100 pointer-events-none"
    style={{
      height: 2,
      margin: "1px 4px",
      borderRadius: 2,
      opacity: active ? 1 : 0,
      background: "linear-gradient(90deg, rgba(34,211,238,0.9), rgba(34,211,238,0.2))",
      boxShadow: active ? "0 0 6px rgba(34,211,238,0.5)" : "none",
    }}
  />
);

const isIndicator = (ind: DropIndicator, id: string, pos: "before" | "after") =>
  ind?.targetId === id && ind?.position === pos;

export function ActivityList({ onSelect, selectedId }: ActivityListProps) {
  const dispatch   = useDispatch();
  const activities = useSelector((state: RootState) => state.activities.activities);
  const folders    = useSelector((state: RootState) => state.activities.folders);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const { tree, isFolderActive } = useFolderTree(activities, folders, selectedId);

  const toggleCollapse = (folderId: string) =>
    setCollapsed(prev => {
      const n = new Set(prev);
      n.has(folderId) ? n.delete(folderId) : n.add(folderId);
      return n;
    });

  const { dragOver, dropIndicator, folderDropProps, itemDropProps, rootDropProps } = useDragDrop(
    folders,
    (folderId) => setCollapsed(prev => { const n = new Set(prev); n.delete(folderId); return n; })
  );

  const handleSelect    = (id: string) => { onSelect(id); dispatch(setSelectedActivity(id)); };
  const handleDuplicate = (originalId: string) => {
    const latest = activities[activities.length - 1];
    if (latest && latest.id !== originalId && latest.name?.includes("(copy)"))
      handleSelect(latest.id);
  };

  const folderStyle = (isDropTarget: boolean, active: boolean): React.CSSProperties => ({
    background: isDropTarget ? "rgba(8,20,36,0.96)" : active ? "rgba(6,18,32,0.94)" : "rgba(6,12,24,0.80)",
    backgroundImage: (isDropTarget || active)
      ? "linear-gradient(160deg, rgba(34,211,238,0.06) 0%, rgba(34,211,238,0.02) 50%, transparent 100%)"
      : "linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 50%, transparent 100%)",
    border: `1px solid ${isDropTarget ? "rgba(34,211,238,0.35)" : active ? "rgba(34,211,238,0.28)" : "rgba(148,163,184,0.09)"}`,
    boxShadow: active
      ? "inset 0 1px 0 rgba(255,255,255,0.07), 0 0 10px rgba(34,211,238,0.06)"
      : "inset 0 1px 0 rgba(255,255,255,0.04)",
  });

  // Activity wrapper — drag source + reorder drop target
  const DraggableActivity = ({ activity, parentId }: { activity: any; parentId?: string }) => (
    <>
      <DropLine active={isIndicator(dropIndicator, activity.id, "before")} />
      <div
        draggable
        onDragStart={(e) => {
          e.stopPropagation();
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("type", "activity");
          e.dataTransfer.setData("id", activity.id);
        }}
        {...itemDropProps(activity.id, parentId)}
      >
        <ActivityCard
          activity={activity}
          selectedId={selectedId}
          onSelect={handleSelect}
          onDuplicate={handleDuplicate}
        />
      </div>
      <DropLine active={isIndicator(dropIndicator, activity.id, "after")} />
    </>
  );

  const renderFolder = (folder?: FolderModel, parentId?: string, depth = 0): React.ReactNode => {
    const key          = folder?.id ?? "root";
    const bucket       = tree[key] || { folders: [], activities: [] };
    const active       = folder ? isFolderActive(folder.id) : false;
    const isDropTarget = dragOver === key;
    const isExpanded   = folder ? !collapsed.has(folder.id) : true;
    const hasChildren  = bucket.folders.length > 0 || bucket.activities.length > 0;

    return (
      <li key={key} className="list-none">
        {folder && (
          <>
            {/*
              Thin sentinel above the folder row — reorder "before".
              Separate element so it never conflicts with the drop-into zone.
            */}
            <div
              style={{ height: 8, marginBottom: -4 }}
              {...itemDropProps(folder.id, parentId)}
            />
            <DropLine active={isIndicator(dropIndicator, folder.id, "before")} />

            {/*
              Folder row — ONLY handles drop-INTO (folderDropProps).
              Also the drag source for moving the folder itself.
              No reorder logic here at all.
            */}
            <div
              className="relative flex items-center gap-1.5 w-full px-2 py-1.5 mb-0.5 rounded-xl transition-all duration-200 select-none overflow-hidden"
              style={folderStyle(isDropTarget, active)}
              draggable
              onDragStart={(e) => {
                e.stopPropagation();
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("type", "folder");
                e.dataTransfer.setData("id", folder.id);
              }}
              {...folderDropProps(key, folder.id)}
            >
              {/* Full-cover drag overlay.
                  Always on top of inner children (z-index 10) but only captures
                  pointer events when a drag is in progress (dragOver or indicator set).
                  This ensures drag events hit this overlay instead of child buttons/spans,
                  while normal clicks still fall through when not dragging. */}
              <div
                style={{
                  position: "absolute", inset: 0, zIndex: 10,
                  pointerEvents: (dragOver !== null || dropIndicator !== null) ? "auto" : "none",
                  cursor: (dragOver !== null || dropIndicator !== null) ? "copy" : "default",
                }}
                onDragOver={folderDropProps(key, folder.id).onDragOver}
                onDragLeave={folderDropProps(key, folder.id).onDragLeave}
                onDrop={folderDropProps(key, folder.id).onDrop}
              />
              <button
                className="flex-shrink-0 flex items-center justify-center w-4 h-4 transition-colors focus:outline-none"
                style={{ color: active ? "rgba(34,211,238,0.8)" : "rgba(148,163,184,0.5)" }}
                onClick={(e) => { e.stopPropagation(); toggleCollapse(folder.id); }}
                title={collapsed.has(folder.id) ? "Expand" : "Collapse"}
              >
                <ChevronIcon rotated={collapsed.has(folder.id)} />
              </button>

              <FolderName
                folder={folder}
                onCommit={(id, name) => dispatch(renameFolder({ id, name }))}
                onDragStart={(e) => e.stopPropagation()}
              />

              <button
                className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-md ml-auto transition-all duration-150 focus:outline-none"
                style={{ color: "rgba(100,116,139,0.6)" }}
                onClick={(e) => { e.stopPropagation(); dispatch(deleteFolder(folder.id)); }}
                title="Delete folder"
                onMouseEnter={(e) => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = "rgba(248,113,113,0.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(100,116,139,0.6)"; e.currentTarget.style.background = "transparent"; }}
              >
                <TrashIcon />
              </button>
            </div>

            <DropLine active={isIndicator(dropIndicator, folder.id, "after")} />
            {/*
              Thin sentinel below the folder row — reorder "after".
            */}
            <div
              style={{ height: 8, marginTop: -4 }}
              {...itemDropProps(folder.id, parentId)}
            />
          </>
        )}

        {isExpanded && hasChildren && (
          folder ? (
            <TreeChildren isActive={active}>
              {bucket.folders.map((f) => (
                <ChildRow key={f.id} isActive={isFolderActive(f.id)}>
                  {renderFolder(f, folder.id, depth + 1)}
                </ChildRow>
              ))}
              {bucket.activities.map((a) => (
                <ChildRow key={a.id} isActive={a.id === selectedId}>
                  <DraggableActivity activity={a} parentId={folder.id} />
                </ChildRow>
              ))}
            </TreeChildren>
          ) : (
            <ul className="space-y-0">
              {bucket.folders.map((f) => renderFolder(f, undefined, depth + 1))}
              {bucket.activities.map((a) => (
                <DraggableActivity key={a.id} activity={a} parentId={undefined} />
              ))}
            </ul>
          )
        )}
      </li>
    );
  };

  return (
    <div className="min-h-full space-y-0.5 pb-16" {...rootDropProps}>
      <ul className="space-y-0.5">
        {renderFolder(undefined)}
      </ul>
      <div
        className="flex items-center justify-center transition-all duration-150"
        style={{
          height: 36,
          margin: "4px 8px",
          borderRadius: 10,
          border: `1.5px dashed ${dragOver === "root" ? "rgba(34,211,238,0.4)" : "transparent"}`,
          color: dragOver === "root" ? "rgba(34,211,238,0.6)" : "transparent",
          fontSize: "0.65rem",
          letterSpacing: "0.08em",
          fontWeight: 600,
          textTransform: "uppercase",
        }}
      >
        {dragOver === "root" ? "Drop to move to root" : ""}
      </div>
    </div>
  );
}