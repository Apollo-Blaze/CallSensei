import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { moveNode, reorderNode } from "../../../state/activitiesSlice";
import type { FolderModel } from "../../../models/FolderModel";

export type DropIndicator = {
  targetId: string;
  position: "before" | "after";
  parentId?: string;
} | null;

export function useDragDrop(
  folders: FolderModel[],
  onDropExpand: (folderId: string) => void,
) {
  const dispatch = useDispatch();
  const [dragOver,      setDragOver]      = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<DropIndicator>(null);
  const pendingPosition = useRef<"before" | "after">("after");

  // ── Helpers ────────────────────────────────────────────────────────────────
  const isInvalidFolderDrop = (dragId: string, dropId?: string): boolean => {
    if (!dropId) return false;
    if (dragId === dropId) return true;
    const parentById: Record<string, string | undefined> = {};
    folders.forEach(f => { parentById[f.id] = f.parentId; });
    let cur: string | undefined = dropId;
    while (cur) {
      if (cur === dragId) return true;
      cur = parentById[cur];
    }
    return false;
  };

  const getPosition = (e: React.DragEvent): "before" | "after" => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return e.clientY < rect.top + rect.height / 2 ? "before" : "after";
  };

  // ── Folder drop — drop INTO folder ────────────────────────────────────────
  const folderDropProps = (key: string, folderId: string) => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation(); // ← CRITICAL: prevent bubbling to parent folders / root
      setDragOver(key);
      setDropIndicator(null);
    },
    onDragLeave: (e: React.DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setDragOver(null);
      }
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation(); // ← CRITICAL: prevent bubbling so parent doesn't also handle
      setDragOver(null);
      setDropIndicator(null);
      const nodeType = e.dataTransfer.getData("type") as "activity" | "folder";
      const id       = e.dataTransfer.getData("id");
      if (!nodeType || !id) return;
      if (nodeType === "folder" && isInvalidFolderDrop(id, folderId)) return;
      dispatch(moveNode({ nodeType, id, newParentId: folderId }));
      onDropExpand(folderId);
    },
  });

  // ── Item drop — reorder before/after an item ──────────────────────────────
  const itemDropProps = (itemId: string, parentId?: string) => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(null);
      const position = getPosition(e);
      pendingPosition.current = position;
      setDropIndicator({ targetId: itemId, position, parentId });
    },
    onDragLeave: (e: React.DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setDropIndicator(null);
      }
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const nodeType = e.dataTransfer.getData("type") as "activity" | "folder";
      const id       = e.dataTransfer.getData("id");
      const position = pendingPosition.current;
      setDropIndicator(null);
      if (!nodeType || !id || id === itemId) return;
      if (nodeType === "folder" && isInvalidFolderDrop(id, parentId)) return;
      dispatch(reorderNode({ nodeType, id, targetId: itemId, position, newParentId: parentId }));
    },
  });

  // ── Root drop — escape all folders, move to root ──────────────────────────
  const rootDropProps = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      // No stopPropagation — this is the outermost container.
      // It only fires when no child already called stopPropagation.
      setDragOver("root");
      setDropIndicator(null);
    },
    onDragLeave: (e: React.DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setDragOver(null);
      }
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(null);
      setDropIndicator(null);
      const nodeType = e.dataTransfer.getData("type") as "activity" | "folder";
      const id = e.dataTransfer.getData("id");
      if (!nodeType || !id) return;
      dispatch(moveNode({ nodeType, id, newParentId: undefined }));
    },
  };

  return { dragOver, dropIndicator, folderDropProps, itemDropProps, rootDropProps };
}