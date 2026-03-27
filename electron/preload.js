"use strict";
// const { contextBridge, ipcRenderer } = require('electron')
// // Expose a minimal, safe API. Extend as needed later.
// contextBridge.exposeInMainWorld('api', {
//   appName: 'CallSensei',
//   patch: {
//     preview: async (
//       patchText: string
//     ): Promise<{
//       ok: boolean
//       message?: string
//       files?: Array<{ path: string; status: 'modify' | 'add' | 'delete' }>
//     }> => {
//       return await ipcRenderer.invoke('patch:preview', { patchText })
//     },
//     apply: async (
//       patchText: string
//     ): Promise<{ ok: boolean; message?: string; written?: string[] }> => {
//       return await ipcRenderer.invoke('patch:apply', { patchText })
//     }
//   },
//   fs: {
//     selectDirectory: async (): Promise<{ ok: boolean; path?: string }> =>
//       ipcRenderer.invoke('fs:selectDirectory'),
//     selectFile: async (
//       defaultPath?: string
//     ): Promise<{ ok: boolean; path?: string }> =>
//       ipcRenderer.invoke('fs:selectFile', { defaultPath }),
//     writeFile: async (
//       filePath: string,
//       content: string
//     ): Promise<{ ok: boolean; message?: string }> =>
//       ipcRenderer.invoke('fs:writeFile', { path: filePath, content }),
//     readFile: async (
//       filePath: string
//     ): Promise<{ ok: boolean; content?: string; message?: string }> =>
//       ipcRenderer.invoke('fs:readFile', { path: filePath })
//   }
// })
// // Bridge used by `GitHubButton.tsx` – exposes `window.electron.githubLogin`
// contextBridge.exposeInMainWorld('electron', {
//   githubLogin: (code: string): Promise<any> =>
//     ipcRenderer.invoke('github-login', code)
// })
const { contextBridge, ipcRenderer } = require('electron');
// Expose a minimal, safe API. Extend as needed later.
contextBridge.exposeInMainWorld('api', {
    appName: 'CallSensei',
    patch: {
        preview: async (patchText) => {
            return await ipcRenderer.invoke('patch:preview', { patchText });
        },
        apply: async (patchText) => {
            return await ipcRenderer.invoke('patch:apply', { patchText });
        }
    },
    fs: {
        selectDirectory: async () => ipcRenderer.invoke('fs:selectDirectory'),
        selectFile: async (defaultPath) => ipcRenderer.invoke('fs:selectFile', { defaultPath }),
        writeFile: async (filePath, content) => ipcRenderer.invoke('fs:writeFile', { path: filePath, content }),
        readFile: async (filePath) => ipcRenderer.invoke('fs:readFile', { path: filePath })
    },
    terminal: {
        spawn: (sessionId, command, cwd) => ipcRenderer.invoke('terminal:spawn', { sessionId, command, cwd }),
        kill: (sessionId) => ipcRenderer.invoke('terminal:kill', { sessionId }),
        write: (sessionId, text) => ipcRenderer.invoke('terminal:write', { sessionId, text }),
    },
});
// Bridge used by `GitHubButton.tsx` – exposes `window.electron.githubLogin`
contextBridge.exposeInMainWorld('electron', {
    githubLogin: (code) => {
        return ipcRenderer.invoke('github-login', code);
    },
    // Required for terminal streaming — lets the renderer receive push events
    ipcRenderer: {
        on: (channel, listener) => ipcRenderer.on(channel, listener),
        removeListener: (channel, listener) => ipcRenderer.removeListener(channel, listener),
    },
});
//# sourceMappingURL=preload.js.map