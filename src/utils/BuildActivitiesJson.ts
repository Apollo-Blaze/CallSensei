// src/github/pushActivities.ts
import { serializeActivities } from './activitySerializer';
import type { RootState } from '../state/store';

export function buildActivitiesJson(state: RootState) {
  console.log("inside build activities to json")
  const { activities, folders } = state.activities;

  const exportData = serializeActivities(activities, folders);

  return JSON.stringify(exportData, null, 2);
}
