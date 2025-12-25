// src/utils/activitySerializer.ts
import type { ActivityModel } from '../models/ActivityModel';
import type { FolderModel } from '../models/FolderModel';



export function serializeActivity(
  selectedId:string,
  activities: ActivityModel[],
  folders: FolderModel[]
) {
  
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    activities:
    activities
    .filter(a => a.id == selectedId)
    .map( a=> (
    {
      id: a.id,
      name: a.name,
      url: a.url,
      request: a.request,
      response: a.response ?? null,
      parentId: a.parentId ?? null,
    }
  )),
    folders: folders.map(f => ({
      id: f.id,
      name: f.name,
      parentId: f.parentId ?? null,
    })),
  };
}

export function serializeActivities(
  activities: ActivityModel[],
  folders: FolderModel[]
) {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    activities: activities.map(a => ({
      id: a.id,
      name: a.name,
      url: a.url,
      request: a.request,
      response: a.response ?? null,
      parentId: a.parentId ?? null,
    })),
    folders: folders.map(f => ({
      id: f.id,
      name: f.name,
      parentId: f.parentId ?? null,
    })),
  };
}
