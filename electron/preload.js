const { contextBridge, ipcRenderer } = require('electron')
// Expose a minimal, safe API. Extend as needed later.
contextBridge.exposeInMainWorld('api', {
    appName: 'CallSensei',
    patch: {
        preview: async (patchText) => {
            return await ipcRenderer.invoke('patch:preview', { patchText });
        },
        apply: async (patchText) => {
            return await ipcRenderer.invoke('patch:apply', { patchText });
        },
    },
    fs: {
        selectDirectory: async () => ipcRenderer.invoke('fs:selectDirectory'),
        selectFile: async (defaultPath) => ipcRenderer.invoke('fs:selectFile', { defaultPath }),
        writeFile: async (filePath, content) => ipcRenderer.invoke('fs:writeFile', { path: filePath, content })
    }
});
//# sourceMappingURL=preload.js.map