import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RequestModel, ResponseModel } from '../models';
import { createRequest, createResponse } from '../models';

interface ActivitiesState {
    activities: RequestModel[];
    latestResponse: ResponseModel | null;
}

const initialState: ActivitiesState = {
    activities: [],
    latestResponse: null,
};

const activitiesSlice = createSlice({
    name: 'activities',
    initialState,
    reducers: {
        addRequest: (state, action: PayloadAction<Omit<RequestModel, 'id' | 'timestamp'>>) => {
            const newRequest = createRequest(action.payload);
            state.activities.push(newRequest);
        },
        duplicateRequest: (state, action: PayloadAction<string>) => {
            const orig = state.activities.find(a => a.id === action.payload);
            if (orig) {
                const duplicatedRequest = createRequest({
                    method: orig.method,
                    url: orig.url,
                    headers: { ...orig.headers }, // Create a new object to avoid reference sharing
                    body: orig.body,
                    name: (orig.name || 'Request') + ' (copy)',
                    description: orig.description,
                    tags: orig.tags ? [...orig.tags] : [], // Create a new array to avoid reference sharing
                    isActive: orig.isActive,
                });
                state.activities.push(duplicatedRequest);
            }
        },
        deleteRequest: (state, action: PayloadAction<string>) => {
            state.activities = state.activities.filter(a => a.id !== action.payload);
        },
        setLatestResponse: (state, action: PayloadAction<ResponseModel | null>) => {
            state.latestResponse = action.payload;
        },
        updateActivity: (state, action: PayloadAction<{ id: string; data: Partial<Omit<RequestModel, 'id' | 'timestamp'>> }>) => {
            const activity = state.activities.find(a => a.id === action.payload.id);
            if (activity) {
                Object.assign(activity, action.payload.data);
            }
        },
        renameActivity: (state, action: PayloadAction<{ id: string; name: string }>) => {
            const activity = state.activities.find(a => a.id === action.payload.id);
            if (activity) {
                activity.name = action.payload.name;
            }
        },
    },
});

export const { addRequest, duplicateRequest, deleteRequest, setLatestResponse, updateActivity, renameActivity } = activitiesSlice.actions;
export default activitiesSlice.reducer; 