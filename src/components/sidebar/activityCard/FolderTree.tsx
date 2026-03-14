import { useMemo } from "react";
import type { ActivityModel } from "../../../models/ActivityModel";
import type { FolderModel } from "../../../models/FolderModel";

export type TreeBucket = { folders: FolderModel[]; activities: ActivityModel[] };
export type TreeMap = Record<string, TreeBucket>;

/** Builds a parent→children map and provides active-folder detection. */
export function useFolderTree(
  activities: ActivityModel[],
  folders: FolderModel[],
  selectedId: string | null,
) {
  const tree = useMemo<TreeMap>(() => {
    const map: TreeMap = {};
    const bucket = (parentId?: string): TreeBucket => {
      const key = parentId || "root";
      if (!map[key]) map[key] = { folders: [], activities: [] };
      return map[key];
    };
    folders.forEach((f) => bucket(f.parentId).folders.push(f));
    activities.forEach((a) => bucket(a.parentId).activities.push(a));
    return map;
  }, [activities, folders]);

  /** folderId → Set of all descendant activity ids (recursive) */
  const folderDescendants = useMemo(() => {
    const desc: Record<string, Set<string>> = {};
    const collect = (folderId: string): Set<string> => {
      if (desc[folderId]) return desc[folderId];
      const set = new Set<string>();
      const b = tree[folderId] || { folders: [], activities: [] };
      b.activities.forEach((a) => set.add(a.id));
      b.folders.forEach((f) => collect(f.id).forEach((id) => set.add(id)));
      desc[folderId] = set;
      return set;
    };
    folders.forEach((f) => collect(f.id));
    return desc;
  }, [tree, folders]);

  const isFolderActive = (folderId: string) =>
    !!selectedId && (folderDescendants[folderId]?.has(selectedId) ?? false);

  return { tree, isFolderActive };
}