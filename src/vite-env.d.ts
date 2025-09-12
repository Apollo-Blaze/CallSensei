/// <reference types="vite/client" />

interface Window {
    api: {
        appName: string;
        patch: {
            preview: (patchText: string) => Promise<{ ok: boolean; message?: string; files?: Array<{ path: string; status: 'modify' | 'add' | 'delete' }> }>;
            apply: (patchText: string) => Promise<{ ok: boolean; message?: string; written?: string[] }>;
        }
        , fs: {
            selectDirectory: () => Promise<{ ok: boolean; path?: string }>;
            selectFile: (defaultPath?: string) => Promise<{ ok: boolean; path?: string }>;
            writeFile: (filePath: string, content: string) => Promise<{ ok: boolean; message?: string }>;
        }
    }
}
