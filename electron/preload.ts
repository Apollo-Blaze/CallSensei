import { contextBridge } from 'electron'

// Expose a minimal, safe API. Extend as needed later.
contextBridge.exposeInMainWorld('api', {
    appName: 'CallSensei',
})

export { }


