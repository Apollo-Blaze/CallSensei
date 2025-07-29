import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import{ createActivity, type ActivityModel } from '../models/ActivityModel';
import type { RequestModel} from '../models/RequestModel';
import type { ResponseModel} from '../models/ResponseModel';
export interface ActivitiesState {
  activities: ActivityModel[];
  selectedActivityId?: string;
}

const initialState: ActivitiesState = {
  activities: [],
  selectedActivityId: undefined,
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
        const duplicated = createActivity(newId,orig.name, orig.url, orig.request);
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
        console.log("entered inside of renaming if");
        activity.request.name = action.payload.name;
      }
    },
    updateActivity(state, action: PayloadAction<{ id: string; data: Partial<ActivityModel>}>) {
      const activity = state.activities.find(a => a.id === action.payload.id);
      if (activity) {
        Object.assign(activity, action.payload.data);
      }
    },
  },
});

export const { addActivity, setSelectedActivity, duplicateActivity, deleteActivity, renameActivity, updateActivity } = activitiesSlice.actions;
export default activitiesSlice.reducer; 