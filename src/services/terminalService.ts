// terminalService.ts
// Drop this file alongside injectService.ts

type TerminalDataHandler  = (data: string) => void
type TerminalExitHandler  = (code: number | null) => void

function hasApi(): boolean {
    // @ts-ignore
    return typeof window !== 'undefined' && !!window.api
}

// ─── Listener registry (renderer-side) ───────────────────────────────────────
// Multiple terminal panels can be open at once, each keyed by sessionId.

const dataListeners = new Map<string, Set<TerminalDataHandler>>()
const exitListeners = new Map<string, Set<TerminalExitHandler>>()

// Wire up the global ipcRenderer listeners once
if (typeof window !== 'undefined') {
    // @ts-ignore
    window.electron?.ipcRenderer?.on?.('terminal:data', (_event: unknown, payload: { sessionId: string; data: string }) => {
        dataListeners.get(payload.sessionId)?.forEach(fn => fn(payload.data))
    })
    // @ts-ignore
    window.electron?.ipcRenderer?.on?.('terminal:exit', (_event: unknown, payload: { sessionId: string; code: number | null }) => {
        exitListeners.get(payload.sessionId)?.forEach(fn => fn(payload.code))
    })
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const terminalService = {
    /**
     * Spawn a shell command and stream its output.
     * Returns { ok, pid } or { ok: false, message }.
     */
    async spawn(sessionId: string, command: string, cwd?: string) {
        if (!hasApi()) return { ok: false, message: 'Desktop API unavailable. Run the Electron app.' }
        try {
            // @ts-ignore
            return await window.api.terminal.spawn(sessionId, command, cwd)
        } catch (e: any) {
            return { ok: false, message: e?.message ?? 'spawn failed' }
        }
    },

    /** Send raw text to the process stdin (e.g. answers to prompts, or '\x03' for Ctrl+C). */
    async write(sessionId: string, text: string) {
        if (!hasApi()) return { ok: false }
        try {
            // @ts-ignore
            return await window.api.terminal.write(sessionId, text)
        } catch { return { ok: false } }
    },

    /** Kill the running process for this session. */
    async kill(sessionId: string) {
        if (!hasApi()) return { ok: false }
        try {
            // @ts-ignore
            return await window.api.terminal.kill(sessionId)
        } catch { return { ok: false } }
    },

    /** Register a callback for stdout/stderr chunks. Returns an unsubscribe fn. */
    onData(sessionId: string, fn: TerminalDataHandler): () => void {
        if (!dataListeners.has(sessionId)) dataListeners.set(sessionId, new Set())
        dataListeners.get(sessionId)!.add(fn)
        return () => dataListeners.get(sessionId)?.delete(fn)
    },

    /** Register a callback for process exit. Returns an unsubscribe fn. */
    onExit(sessionId: string, fn: TerminalExitHandler): () => void {
        if (!exitListeners.has(sessionId)) exitListeners.set(sessionId, new Set())
        exitListeners.get(sessionId)!.add(fn)
        return () => exitListeners.get(sessionId)?.delete(fn)
    },

    /** Remove all listeners for a session (call when component unmounts). */
    cleanup(sessionId: string) {
        dataListeners.delete(sessionId)
        exitListeners.delete(sessionId)
    },
}

export default terminalService