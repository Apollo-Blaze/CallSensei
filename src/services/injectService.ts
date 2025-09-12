type PreviewFile = { path: string; status: 'modify' | 'add' | 'delete' }

function hasApi(): boolean {
    // @ts-ignore
    return typeof window !== 'undefined' && !!window.api
}

export const injectService = {
    async previewPatch(patchText: string): Promise<{ ok: boolean; files?: PreviewFile[]; message?: string }> {
        if (!hasApi()) return { ok: false, message: 'Desktop API unavailable. Run Electron app.' }
        // @ts-ignore - exposed via preload
        return await window.api.patch.preview(patchText)
    },
    async applyPatch(patchText: string): Promise<{ ok: boolean; written?: string[]; message?: string }> {
        if (!hasApi()) return { ok: false, message: 'Desktop API unavailable. Run Electron app.' }
        // @ts-ignore - exposed via preload
        return await window.api.patch.apply(patchText)
    },
    async selectDirectory(): Promise<{ ok: boolean; path?: string }> {
        if (!hasApi()) return { ok: false }
        // @ts-ignore - exposed via preload
        return await window.api.fs.selectDirectory()
    },
    async selectFile(defaultPath?: string): Promise<{ ok: boolean; path?: string }> {
        if (!hasApi()) return { ok: false }
        // @ts-ignore - exposed via preload
        return await window.api.fs.selectFile(defaultPath)
    },
    async writeFile(filePath: string, content: string): Promise<{ ok: boolean; message?: string }> {
        if (!hasApi()) return { ok: false, message: 'Desktop API unavailable. Run Electron app.' }
        // @ts-ignore - exposed via preload
        return await window.api.fs.writeFile(filePath, content)
    }
}

export default injectService


