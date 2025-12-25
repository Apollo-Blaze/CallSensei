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
    token: string;
    owner: string;
    repo: string;
    path: string;
    message: string;
    content: string;
    sha?: string;
  }) {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
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
    path: 'activities.json',
    message: 'Update activities',
    content: encoded,
    // sha: existingFileSha (only needed if updating)
  });
}
// function buildActivitiesJson(state: { activities: ActivitiesState }) {
//   throw new Error('Function not implemented.');
// }

