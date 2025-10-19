import { configureStore } from '@reduxjs/toolkit';
import activitiesReducer from './activitiesSlice';
import githubReducer from './githubSlice';

export const store = configureStore({
    reducer: {
        activities: activitiesReducer,
        github: githubReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 
