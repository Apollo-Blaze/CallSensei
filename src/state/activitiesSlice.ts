import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import{ createActivity, type ActivityModel } from '../models/ActivityModel';
import { createFolder, type FolderModel } from '../models/FolderModel';
// import type { RequestModel} from '../models/RequestModel';
// import type { ResponseModel} from '../models/ResponseModel';
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

const activitiesSlice = createSlice({
  name: 'activities',
  initialState,
  reducers: {
    addActivity(state, action: PayloadAction<ActivityModel>) {
      state.activities.push(action.payload);
    },
    setSelectedActivity(state, action: PayloadAction<string>) {
      state.selectedActivityId = action.payload;
    },
    duplicateActivity(state, action: PayloadAction<string>) {
      const orig = state.activities.find(a => a.id === action.payload);
      if (orig) {
       const newId = Math.random().toString(36).substr(2, 9);
        const duplicated = createActivity(newId,orig.name, orig.url, orig.request, orig.response, orig.parentId);
        state.activities.push(duplicated);
      }
    },
    deleteActivity(state, action: PayloadAction<string>) {
      state.activities = state.activities.filter(a => a.id !== action.payload);
    },
    renameActivity(state, action: PayloadAction<{ id: string; name: string }>) {
      console.log("renameing");
      const activity = state.activities.find(a => a.id === action.payload.id);
      if (activity) {
        console.log("entered inside of renaming if" + action.payload.name);
        activity.request.name = action.payload.name;
      }
    },
    addFolder(state, action: PayloadAction<Partial<FolderModel> | undefined>) {
      const folder = createFolder(action.payload || {});
      state.folders.push(folder);
    },
    renameFolder(state, action: PayloadAction<{ id: string; name: string }>) {
      const folder = state.folders.find(f => f.id === action.payload.id);
      if (folder) {
        folder.name = action.payload.name;
      }
    },
    deleteFolder(state, action: PayloadAction<string>) {
      const folderId = action.payload;
      // Move children to root before deleting folder
      state.activities.forEach(a => {
        if (a.parentId === folderId) a.parentId = undefined;
      });
      state.folders.forEach(f => {
        if (f.parentId === folderId) f.parentId = undefined;
      });
      state.folders = state.folders.filter(f => f.id !== folderId);
    },
    moveNode(
      state,
      action: PayloadAction<{ nodeType: 'activity' | 'folder'; id: string; newParentId?: string }>
    ) {
      const { nodeType, id, newParentId } = action.payload;
      if (nodeType === 'activity') {
        const activity = state.activities.find(a => a.id === id);
        if (activity) activity.parentId = newParentId;
      } else {
        const folder = state.folders.find(f => f.id === id);
        if (folder) folder.parentId = newParentId;
      }
    },
     updateActivity(state, action: PayloadAction<{ id: string; data: Partial<ActivityModel>}>) {
      const activity = state.activities.find(a => a.id === action.payload.id);

      if (activity) {
        console.log("Before update:", activity);
        Object.assign(activity, action.payload.data);
        console.log("After update:", activity);
      }
    },
    
    //immutable update
    // updateActivity(state, action: PayloadAction<{ id: string; data: Partial<ActivityModel> }>) {
    //   console.log("updateActivity\n");
    //   state.activities = state.activities.map(activity =>
    //     activity.id === action.payload.id
    //       ? { ...activity, ...action.payload.data }
    //       : activity
    //   );
    // }
  },
});

export const { addActivity, setSelectedActivity, duplicateActivity, deleteActivity, renameActivity, addFolder, renameFolder, deleteFolder, moveNode, updateActivity } = activitiesSlice.actions;
export default activitiesSlice.reducer; 