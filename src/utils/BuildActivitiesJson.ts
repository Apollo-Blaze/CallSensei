// src/github/pushActivities.ts
import { serializeActivities } from './activitySerializer';
import type { RootState } from '../state/store';
import type { ActivityModel } from '../models/ActivityModel';

export function buildActivitiesJson(state: RootState) {
  console.log("inside build activities to json")
  const { activities, folders } = state.activities;

  const exportData = serializeActivities(activities, folders);

  return JSON.stringify(exportData, null, 2);
}

export function buildIndividualActivity(activity: ActivityModel): string {
  console.log("inside build individual activity to json")
  // For individual activity, include only that activity and no folders for simplicity
  const exportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    activities: [activity],
    folders: [],
  };

  return JSON.stringify(exportData, null, 2);
}
