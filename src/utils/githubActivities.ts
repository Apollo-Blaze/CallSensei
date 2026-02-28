export interface PulledActivity {
  id: string;
  name: string;
  url: string;
  request: {
    id: string;
    method: string;
    url: string;
    headers: Record<string, string>;
    body: string;
    timestamp: string;
    name: string;
  };
  response?: null | unknown;
  parentId: string | null;
}

export interface PulledFolder {
  id: string;
  name: string;
  parentId: string | null;
}

export interface PulledData {
  version: number;
  exportedAt: string;
  activities: PulledActivity[];
  folders: PulledFolder[];
  /** sha is needed later if you want to push an update back to the same file */
  sha: string;
}

export function encodeForGitHub(content: string) {
    return btoa(unescape(encodeURIComponent(content)));
  }

  // src/github/pushActivities.ts
export async function pushActivitiesToGitHub({
    token,
    owner,
    repo,
    path,
    message,
    content,
    sha, // optional (needed if file already exists)
  }: {
    token: any;
    owner: string;
    repo: string;
    path: string;
    message: string;
    content: string;
    sha?: string;
  }) {
    console.log("inside push activities to github")
    console.log("token", token.access_token)
    console.log("owner", owner)
    console.log("repo", repo)
    console.log("path", path)
    console.log("message", message)
    console.log("content", content)
    console.log("sha", sha)
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          content,
          sha,
        }),
      }
    );
  
    if (!res.ok) {
      throw new Error('Failed to push activities to GitHub');
    }
  
    return res.json();
  }
  
import type githubSlice  from '../state/githubSlice';
  // Example usage
import { store } from '../state/store';
import  ActivitiesState  from '../state/activitiesSlice';
import { buildActivitiesJson } from './BuildActivitiesJson';


export async function handlePush() {
  console.log("inside handlepushgithub")
  const state = store.getState();
  const token = state.github.token;

  if (!token) throw new Error('Not logged in');

  const json = buildActivitiesJson(state);
  const encoded = encodeForGitHub(json!);

  await pushActivitiesToGitHub({
    token,
    owner: 'Clasherzz',
    repo: 'testCallSensei',
    path: 'activities2.json',
    message: 'Update activities',
    content: encoded,
    // sha: existingFileSha (only needed if updating)
  });
}
// function buildActivitiesJson(state: { activities: ActivitiesState }) {
//   throw new Error('Function not implemented.');
// }

// ── Token helper ──────────────────────────────────────────────────────────────
/**
 * Accepts either a raw token string or an object like { access_token: string }.
 * Always returns the plain token string.
 */
function resolveToken(token: string | { access_token: string } | null): string {
  if (!token) throw new Error("Not logged in — token is missing.");
  if (typeof token === "string") return token;
  if (token.access_token) return token.access_token;
  throw new Error("Unrecognised token shape: " + JSON.stringify(token));
}

// ── Pull ──────────────────────────────────────────────────────────────────────
/**
 * Fetches and decodes `activities.json` (or any path) from a GitHub repo.
 *
 * @example
 * const data = await pullActivitiesFromGitHub({
 *   token: state.github.token,
 *   owner: "Clasherzz",
 *   repo:  "testCallSensei",
 *   path:  "activities.json",
 * });
 */
export async function pullActivitiesFromGitHub({
  token,
  owner,
  repo,
  path = "activities.json",
}: {
  token: string | { access_token: string } | null;
  owner: string;
  repo: string;
  path?: string;
}): Promise<PulledData> {
  const resolvedToken = resolveToken(token);

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      headers: {
        Authorization: `Bearer ${resolvedToken}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `GitHub pull failed (${res.status}): ${(err as any).message ?? res.statusText}`
    );
  }

  const file = await res.json();

  // GitHub returns content as base64 with newlines — strip them before decoding
  const raw = atob(file.content.replace(/\n/g, ""));
  const parsed = JSON.parse(raw);

  return {
    version: parsed.version ?? 1,
    exportedAt: parsed.exportedAt ?? new Date().toISOString(),
    activities: parsed.activities ?? [],
    folders: parsed.folders ?? [],
    sha: file.sha, // keep this — you'll need it for future pushes
  };
}

// ── Import selected items into your local Redux state ─────────────────────────
/**
 * Given a pulled dataset and a set of selected activity IDs, returns only the
 * activities and the folders that are actually needed (no orphan folders).
 *
 * Use the return value to dispatch `addActivity` / `addFolder` actions.
 */
export function filterSelected(
  data: PulledData,
  selectedIds: string[]
): { activities: PulledActivity[]; folders: PulledFolder[] } {
  const selectedActivities = data.activities.filter((a) =>
    selectedIds.includes(a.id)
  );

  // Only include folders that have at least one selected activity inside them
  const neededFolderIds = new Set(
    selectedActivities.map((a) => a.parentId).filter(Boolean) as string[]
  );

  // Also pull in ancestor folders recursively
  const folderMap = new Map(data.folders.map((f) => [f.id, f]));
  const resolveAncestors = (id: string) => {
    let current = folderMap.get(id);
    while (current) {
      neededFolderIds.add(current.id);
      current = current.parentId ? folderMap.get(current.parentId) : undefined;
    }
  };
  neededFolderIds.forEach(resolveAncestors);

  const selectedFolders = data.folders.filter((f) =>
    neededFolderIds.has(f.id)
  );

  return { activities: selectedActivities, folders: selectedFolders };
}
