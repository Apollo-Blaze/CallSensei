import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import os from 'node:os'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow: BrowserWindow | null = null

function getViteDevServerUrl(): string | null {
    return process.env.VITE_DEV_SERVER_URL || null
}

async function createMainWindow(): Promise<void> {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    })

    // Maximize the window after creation
    mainWindow.maximize()

    const devServerUrl = getViteDevServerUrl()
    if (devServerUrl) {
        await mainWindow.loadURL(devServerUrl)
        mainWindow.webContents.openDevTools({ mode: 'detach' })
    } else {
        const indexHtmlPath = path.join(__dirname, '..', 'dist', 'index.html')
        await mainWindow.loadFile(indexHtmlPath)
    }

    mainWindow.on('closed', () => {
        mainWindow = null
    })
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        void createMainWindow()
    }
})

app.whenReady().then(() => {
    void createMainWindow()
})

// Very small unified-diff applier (limited). For production, prefer a library.
function applyUnifiedDiff(baseDir: string, patchText: string): { ok: boolean; message?: string; written?: string[] } {
    const filesWritten: string[] = []
    const chunks = patchText.split(/^diff --git .*$/m).filter(Boolean)
    if (chunks.length === 0) {
        return { ok: false, message: 'No diff chunks found' }
    }

    for (const chunk of chunks) {
        const fileHeaderMatch = chunk.match(/^\+\+\+\s+a\/(.*)$|^\+\+\+\s+b\/(.*)$/m)
        const altHeaderMatch = chunk.match(/^\+\+\+\s+(.*)$/m)
        let relativePath = fileHeaderMatch?.[1] || fileHeaderMatch?.[2] || altHeaderMatch?.[1]
        if (!relativePath) {
            // try index.html style patches: --- a/path +++ b/path
            const both = chunk.match(/^\+\+\+\s+b\/(.*)$/m)
            relativePath = both?.[1] || ''
        }
        if (!relativePath) continue

        const targetPath = path.resolve(baseDir, relativePath)
        const isDelete = /deleted file mode/.test(chunk)
        const isNew = /new file mode/.test(chunk)

        if (isDelete) {
            if (fs.existsSync(targetPath)) {
                fs.rmSync(targetPath)
                filesWritten.push(targetPath)
            }
            continue
        }

        // Fallback: If patch contains a full file block marker, extract new content between markers
        // This simple approach supports patches that include "@@" hunks replaced with final file snapshot demarcated by special markers.
        const contentMarkerStart = chunk.indexOf('@@ FILE_CONTENT_START @@')
        const contentMarkerEnd = chunk.indexOf('@@ FILE_CONTENT_END @@')
        if (contentMarkerStart !== -1 && contentMarkerEnd !== -1 && contentMarkerEnd > contentMarkerStart) {
            const newContent = chunk
                .slice(contentMarkerStart + '@@ FILE_CONTENT_START @@'.length)
                .slice(0, contentMarkerEnd - (contentMarkerStart + '@@ FILE_CONTENT_START @@'.length))
                .replace(/^\n/, '')
            fs.mkdirSync(path.dirname(targetPath), { recursive: true })
            fs.writeFileSync(targetPath, newContent, 'utf8')
            filesWritten.push(targetPath)
            continue
        }

        // Minimal hunk applier: if the patch provides a full new file via lines starting with '+' and no '-'
        const plusLines = chunk.match(/^\+[^+].*$/gm) || []
        const minusLines = chunk.match(/^-[^-].*$/gm) || []
        const looksLikeReplacement = plusLines.length > 0 && minusLines.length >= 0 && /@@/.test(chunk)

        if (looksLikeReplacement) {
            // naive: take all context and '+' lines to reconstruct content when patch is a full-file replace hunk
            const finalLines: string[] = []
            const lines = chunk.split(/\r?\n/)
            for (const line of lines) {
                if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('diff ') || line.startsWith('index ') || line.startsWith('@@')) continue
                if (line.startsWith('+') && !line.startsWith('++')) {
                    finalLines.push(line.slice(1))
                } else if (!line.startsWith('-')) {
                    // keep context lines
                    if (!(line.startsWith(' ') || line === '')) continue
                    finalLines.push(line.replace(/^ /, ''))
                }
            }
            fs.mkdirSync(path.dirname(targetPath), { recursive: true })
            fs.writeFileSync(targetPath, finalLines.join(os.EOL), 'utf8')
            filesWritten.push(targetPath)
            continue
        }
    }

    return { ok: true, written: filesWritten }
}

ipcMain.handle('patch:preview', async (_event: any, args: { patchText: string }) => {
    const { patchText } = args
    // Basic preview: list of paths affected
    const fileMatches = [...patchText.matchAll(/^\+\+\+\s+b\/(.*)$/gm)].map(m => ({ path: m[1], status: 'modify' as const }))
    const newFiles = [...patchText.matchAll(/^new file mode .*\nindex.*\n--- \/dev\/null\n\+\+\+ b\/(.*)$/gm)].map(m => ({ path: m[1], status: 'add' as const }))
    const deleted = [...patchText.matchAll(/^deleted file mode .*\nindex.*\n--- a\/(.*)\n\+\+\+ \/dev\/null$/gm)].map(m => ({ path: m[1], status: 'delete' as const }))
    const files = [...newFiles, ...deleted, ...fileMatches]
    return { ok: true, files }
})

ipcMain.handle('patch:apply', async (_event: any, args: { patchText: string }) => {
    const { patchText } = args
    const baseDir = process.cwd()
    try {
        const res = applyUnifiedDiff(baseDir, patchText)
        return res
    } catch (e: any) {
        return { ok: false, message: e?.message || 'Failed to apply patch' }
    }
})

// File system helpers
ipcMain.handle('fs:selectDirectory', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] })
    if (result.canceled || result.filePaths.length === 0) return { ok: false }
    return { ok: true, path: result.filePaths[0] }
})

ipcMain.handle('fs:selectFile', async (_event: any, args: { defaultPath?: string }) => {
    const result = await dialog.showOpenDialog({ properties: ['openFile'], defaultPath: args?.defaultPath })
    if (result.canceled || result.filePaths.length === 0) return { ok: false }
    return { ok: true, path: result.filePaths[0] }
})

ipcMain.handle('fs:writeFile', async (_event: any, args: { path: string; content: string }) => {
    try {
        fs.mkdirSync(path.dirname(args.path), { recursive: true })
        fs.writeFileSync(args.path, args.content, 'utf8')
        return { ok: true }
    } catch (e: any) {
        return { ok: false, message: e?.message || 'Failed to write file' }
    }
})



