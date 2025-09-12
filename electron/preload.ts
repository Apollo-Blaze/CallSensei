import { contextBridge, ipcRenderer } from 'electron'

// Expose a minimal, safe API. Extend as needed later.
contextBridge.exposeInMainWorld('api', {
    appName: 'CallSensei',
    patch: {
        preview: async (patchText: string): Promise<{ ok: boolean; message?: string; files?: Array<{ path: string; status: 'modify' | 'add' | 'delete'; }>; }> => {
            return await ipcRenderer.invoke('patch:preview', { patchText })
        },
        apply: async (patchText: string): Promise<{ ok: boolean; message?: string; written?: string[]; }> => {
            return await ipcRenderer.invoke('patch:apply', { patchText })
        },
    }
    , fs: {
        selectDirectory: async (): Promise<{ ok: boolean; path?: string }> => ipcRenderer.invoke('fs:selectDirectory'),
        selectFile: async (defaultPath?: string): Promise<{ ok: boolean; path?: string }> => ipcRenderer.invoke('fs:selectFile', { defaultPath }),
        writeFile: async (filePath: string, content: string): Promise<{ ok: boolean; message?: string }> => ipcRenderer.invoke('fs:writeFile', { path: filePath, content })
    }
})

export { }


