export const GITHUB_TOKEN_STORAGE_KEY = "callsensei.githubToken";

export function loadGitHubToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(GITHUB_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveGitHubToken(token: string | null | undefined): void {
  if (typeof window === "undefined") return;

  try {
    if (!token) {
      window.localStorage.removeItem(GITHUB_TOKEN_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(GITHUB_TOKEN_STORAGE_KEY, token);
  } catch {
    // Ignore persistence failures such as storage quota or disabled storage.
  }
}
