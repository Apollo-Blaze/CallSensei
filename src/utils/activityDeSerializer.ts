// src/utils/activityDeserializer.ts
import { createActivity } from '../models/ActivityModel';
import { createFolder } from '../models/FolderModel';
import type { ActivityModel } from '../models/ActivityModel';
import type { FolderModel } from '../models/FolderModel';


export function deserializeActivities(json: any): {
  activities: ActivityModel[];
  folders: FolderModel[];
} {
  if (json.version !== 1) {
    throw new Error('Unsupported export version');
  }

  const folders: FolderModel[] = json.folders.map((f: any) =>
    createFolder({
      id: f.id,
      name: f.name,
      parentId: f.parentId ?? undefined,
    })
  );

  const activities: ActivityModel[] = json.activities.map((a: any) =>
    createActivity(
      a.id,
      a.name,
      a.url,
      a.request,
      a.response ?? undefined,
      a.parentId ?? undefined
    )
  );

  return { activities, folders };
}
