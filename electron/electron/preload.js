import { contextBridge } from 'electron';
// Expose a minimal, safe API. Extend as needed later.
contextBridge.exposeInMainWorld('api', {
    appName: 'CallSensei',
});
contextBridge.exposeInMainWorld("electron", {
    githubLogin: (code) => ipcRenderer.invoke("github-login", code),
  });
//# sourceMappingURL=preload.js.map