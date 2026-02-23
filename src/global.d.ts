export {};

declare global {
  interface Window {
    electron: {
      githubLogin: (code: string) => Promise<string>;
    };
  }
}
