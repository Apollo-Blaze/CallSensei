import { configureStore } from '@reduxjs/toolkit';
import activitiesReducer from './activitiesSlice';
import githubReducer from './githubSlice';
import { saveGitHubToken } from '../utils/githubAuthPersistence';
import { loadWorkspaceState, saveWorkspaceState } from '../utils/workspacePersistence';

const preloadedActivitiesState = loadWorkspaceState();

export const store = configureStore({
    reducer: {
        activities: activitiesReducer,
        github: githubReducer
    },
    preloadedState: preloadedActivitiesState
        ? {
            activities: preloadedActivitiesState,
          }
        : undefined,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
                // Ignore these field paths in all actions
                ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
                // Ignore these paths in the state
                ignoredPaths: ['items.dates'],
            },
        }),
});

let persistTimer: ReturnType<typeof setTimeout> | undefined;

store.subscribe(() => {
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
        const state = store.getState();
        saveWorkspaceState(state.activities);
        saveGitHubToken(state.github.token);
    }, 200);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 
