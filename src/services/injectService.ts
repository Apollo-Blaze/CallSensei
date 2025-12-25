type PreviewFile = { path: string; status: 'modify' | 'add' | 'delete' }

function hasApi(): boolean {
    // @ts-ignore
    return typeof window !== 'undefined' && !!window.api
}

export const injectService = {
    async previewPatch(patchText: string): Promise<{ ok: boolean; files?: PreviewFile[]; message?: string }> {
        if (!hasApi()) return { ok: false, message: 'Desktop API unavailable. Run Electron app.' }
        try {
            // @ts-ignore - exposed via preload
            return await window.api.patch.preview(patchText)
        } catch (error) {
            console.error('injectService.previewPatch failed', error)
            return { ok: false, message: 'Failed to preview patch. See console for details.' }
        }
    },
    async applyPatch(patchText: string): Promise<{ ok: boolean; written?: string[]; message?: string }> {
        if (!hasApi()) return { ok: false, message: 'Desktop API unavailable. Run Electron app.' }
        try {
            // @ts-ignore - exposed via preload
            return await window.api.patch.apply(patchText)
        } catch (error) {
            console.error('injectService.applyPatch failed', error)
            return { ok: false, message: 'Failed to apply patch. See console for details.' }
        }
    },
    async selectDirectory(): Promise<{ ok: boolean; path?: string; message?: string }> {
        if (!hasApi()) return { ok: false }
        try {
            // @ts-ignore - exposed via preload
            return await window.api.fs.selectDirectory()
        } catch (error) {
            console.error('injectService.selectDirectory failed', error)
            return { ok: false, message: 'Failed to select directory. See console for details.' }
        }
    },
    async selectFile(defaultPath?: string): Promise<{ ok: boolean; path?: string; message?: string }> {
        if (!hasApi()) return { ok: false }
        try {
            // @ts-ignore - exposed via preload
            return await window.api.fs.selectFile(defaultPath)
        } catch (error) {
            console.error('injectService.selectFile failed', error)
            return { ok: false, message: 'Failed to select file. See console for details.' }
        }
    },
    async writeFile(filePath: string, content: string): Promise<{ ok: boolean; message?: string }> {
        if (!hasApi()) return { ok: false, message: 'Desktop API unavailable. Run Electron app.' }
        try {
            // @ts-ignore - exposed via preload
            return await window.api.fs.writeFile(filePath, content)
        } catch (error) {
            console.error('injectService.writeFile failed', error)
            return { ok: false, message: 'Failed to write file. See console for details.' }
        }
    },
    async readFile(filePath: string): Promise<{ ok: boolean; content?: string; message?: string }> {
        if (!hasApi()) return { ok: false, message: 'Desktop API unavailable. Run Electron app.' }
        try {
            // @ts-ignore - exposed via preload
            return await window.api.fs.readFile(filePath)
        } catch (error) {
            console.error('injectService.readFile failed', error)
            return { ok: false, message: 'Failed to read file. See console for details.' }
        }
    }
}

export default injectService


