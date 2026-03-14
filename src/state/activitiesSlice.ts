import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { createActivity, type ActivityModel } from '../models/ActivityModel';
import { createFolder, type FolderModel } from '../models/FolderModel';

export interface ActivitiesState {
  activities: ActivityModel[];
  selectedActivityId?: string;
  folders: FolderModel[];
}

const initialState: ActivitiesState = {
  activities: [],
  selectedActivityId: undefined,
  folders: [],
};

// ── Helper: splice item from fromIndex to toIndex in place ──────────────────
function spliceMove<T>(arr: T[], fromIndex: number, toIndex: number) {
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= arr.length || toIndex >= arr.length) return;
  const [item] = arr.splice(fromIndex, 1);
  arr.splice(toIndex, 0, item);
}

const activitiesSlice = createSlice({
  name: 'activities',
  initialState,
  reducers: {

    // ── add a full ActivityModel ────────────────────────────────────────────
    addActivity(state, action: PayloadAction<ActivityModel>) {
      state.activities.push(action.payload);
    },

    // ── set selected activity ───────────────────────────────────────────────
    setSelectedActivity(state, action: PayloadAction<string>) {
      state.selectedActivityId = action.payload;
    },

    // ── duplicate an activity ───────────────────────────────────────────────
    duplicateActivity(state, action: PayloadAction<string>) {
      const orig = state.activities.find(a => a.id === action.payload);
      if (orig) {
        const newId = Math.random().toString(36).substr(2, 9);
        const dup = createActivity(newId, orig.name, orig.url, orig.request, orig.response, orig.parentId);
        state.activities.push(dup);
      }
    },

    // ── delete an activity ──────────────────────────────────────────────────
    deleteActivity(state, action: PayloadAction<string>) {
      state.activities = state.activities.filter(a => a.id !== action.payload);
    },

    // ── rename an activity (syncs request.name too) ─────────────────────────
    renameActivity(state, action: PayloadAction<{ id: string; name: string }>) {
      const a = state.activities.find(a => a.id === action.payload.id);
      if (a) {
        a.name = action.payload.name;
        if (a.request) a.request.name = action.payload.name;
      }
    },

    // ── add a folder ────────────────────────────────────────────────────────
    addFolder(state, action: PayloadAction<Partial<FolderModel> | undefined>) {
      state.folders.push(createFolder(action.payload || {}));
    },

    // ── rename a folder ─────────────────────────────────────────────────────
    renameFolder(state, action: PayloadAction<{ id: string; name: string }>) {
      const f = state.folders.find(f => f.id === action.payload.id);
      if (f) f.name = action.payload.name;
    },

    // ── delete folder + all descendants + their activities ──────────────────
    deleteFolder(state, action: PayloadAction<string>) {
      const ids = new Set<string>([action.payload]);
      const collect = (parentId: string) => {
        state.folders.forEach(f => { if (f.parentId === parentId) { ids.add(f.id); collect(f.id); } });
      };
      collect(action.payload);
      state.activities = state.activities.filter(a => !(a.parentId && ids.has(a.parentId)));
      state.folders    = state.folders.filter(f => !ids.has(f.id));
    },

    // ── move activity or folder to a new parent folder ──────────────────────
moveNode(
  state,
  action: PayloadAction<{ nodeType: 'activity' | 'folder'; id: string; newParentId?: string }>
) {
  const { nodeType, id, newParentId } = action.payload;
  const arr = nodeType === 'activity' ? state.activities : state.folders;

  const idx = arr.findIndex((x: any) => x.id === id);
  if (idx === -1) return;

  (arr[idx] as any).parentId = newParentId;
},

// ── reorder — place `id` before or after `targetId` within same parent ──
reorderNode(
  state,
  action: PayloadAction<{
    nodeType: 'activity' | 'folder';
    id: string;
    targetId: string;
    position: 'before' | 'after';
    newParentId?: string;
  }>
) {
  const { nodeType, id, targetId, position, newParentId } = action.payload;

  const arr = nodeType === "activity" ? state.activities : state.folders;

  const dragIdx = arr.findIndex((x: any) => x.id === id);
  const targetIdx = arr.findIndex((x: any) => x.id === targetId);

  if (dragIdx === -1 || targetIdx === -1 || id === targetId) return;

  // update parent if needed
  (arr[dragIdx] as any).parentId = newParentId;

  let insertIndex = position === "before" ? targetIdx : targetIdx + 1;

  // adjust for index shift when moving forward
  if (dragIdx < insertIndex) insertIndex--;

  spliceMove(arr, dragIdx, insertIndex);
},


    // ── partial update of an activity ───────────────────────────────────────
    updateActivity(state, action: PayloadAction<{ id: string; data: Partial<ActivityModel> }>) {
      const a = state.activities.find(a => a.id === action.payload.id);
      if (a) Object.assign(a, action.payload.data);
    },

    // ── clear the response on one activity ──────────────────────────────────
    clearActivityResponse(state, action: PayloadAction<string>) {
      const a = state.activities.find(a => a.id === action.payload);
      if (a) a.response = undefined;
    },

    // ── reset entire workspace ───────────────────────────────────────────────
    clearWorkspace(state) {
      state.activities         = [];
      state.folders            = [];
      state.selectedActivityId = undefined;
    },

    // ── move all activities from one parent to another (bulk re-parent) ──────
    reparentActivities(
      state,
      action: PayloadAction<{ fromParentId: string | undefined; toParentId: string | undefined }>
    ) {
      const { fromParentId, toParentId } = action.payload;
      state.activities.forEach(a => { if (a.parentId === fromParentId) a.parentId = toParentId; });
    },
  },
});

export const {
  addActivity,
  setSelectedActivity,
  duplicateActivity,
  deleteActivity,
  renameActivity,
  addFolder,
  renameFolder,
  deleteFolder,
  moveNode,
  reorderNode,
  updateActivity,
  clearActivityResponse,
  clearWorkspace,
  reparentActivities,
} = activitiesSlice.actions;

export default activitiesSlice.reducer;