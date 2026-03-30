import { deserializeActivities } from "./activityDeSerializer";
import { serializeActivities } from "./activitySerializer";
import type { ActivitiesState } from "../state/activitiesSlice";

export const WORKSPACE_STORAGE_KEY = "callsensei.workspace";

type PersistedWorkspace = ReturnType<typeof serializeActivities> & {
  selectedActivityId?: string | null;
};

export function loadWorkspaceState(): ActivitiesState | undefined {
  if (typeof window === "undefined") return undefined;

  const raw = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
  if (!raw) return undefined;

  try {
    const parsed = JSON.parse(raw) as PersistedWorkspace;
    const { activities, folders } = deserializeActivities(parsed);
    const selectedActivityId =
      typeof parsed.selectedActivityId === "string" && activities.some((activity) => activity.id === parsed.selectedActivityId)
        ? parsed.selectedActivityId
        : undefined;

    return {
      activities,
      folders,
      selectedActivityId,
    };
  } catch {
    return undefined;
  }
}

export function saveWorkspaceState(state: ActivitiesState): void {
  if (typeof window === "undefined") return;

  try {
    const payload: PersistedWorkspace = {
      ...serializeActivities(state.activities, state.folders),
      selectedActivityId: state.selectedActivityId ?? null,
    };

    window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore persistence failures such as storage quota or disabled storage.
  }
}
