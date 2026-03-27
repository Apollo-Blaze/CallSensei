/**
 * TerminalPanel.tsx
 *
 * Embedded terminal panel for the API testing platform.
 * Features:
 *  - Run any shell command and stream output live
 *  - ANSI colour stripping for clean display
 *  - Auto-detect error blocks in output
 *  - "Send to AI Fix" button that forwards the captured error + file path
 *    back to the parent (so PatchReview / aiService can act on it)
 *  - Working directory picker
 *  - Kill / re-run controls
 *
 * Props:
 *   onSendToAiFix(error: string, filePath?: string) — called when the user
 *     clicks "Send to AI Fix". Wire this up to your PatchReview / AI flow.
 */

import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
    forwardRef,
    useImperativeHandle,
} from 'react'
import terminalService from '../../../services/terminalService'
import injectService from '../../../services/injectService'

// ─── Tiny ANSI stripper ──────────────────────────────────────────────────────
// We render plain text; strip escape codes so the output is clean.
const ANSI_RE = /\x1B\[[0-9;]*[A-Za-z]|\x1B\][^\x07]*\x07|\x1B[()][AB012]|\r/g
function stripAnsi(s: string): string {
    return s.replace(ANSI_RE, '')
}

// ─── Error-block detector ────────────────────────────────────────────────────
// Returns true if a line looks like an error / warning worth surfacing.
const ERROR_PATTERNS = [
    /error/i,
    /exception/i,
    /traceback/i,
    /fatal/i,
    /cannot find/i,
    /failed/i,
    /uncaught/i,
    /syntaxerror/i,
    /typeerror/i,
    /referenceerror/i,
    /at \w.*:\d+:\d+/,   // JS stack frame
]
function looksLikeError(line: string): boolean {
    return ERROR_PATTERNS.some(p => p.test(line))
}

// ─── File-path extractor ─────────────────────────────────────────────────────
// Tries to pull the first file path out of a block of error text.
const FILE_PATH_RE = /([A-Za-z]:[\\/][\w\s\-./\\]+\.\w+|\/[\w\s\-./]+\.\w+)/g
function extractFilePath(text: string): string | undefined {
    const m = text.match(FILE_PATH_RE)
    return m?.[0]
}

// ─── Unique session id ────────────────────────────────────────────────────────
function makeSessionId() {
    return `term-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

// ─── Line model ──────────────────────────────────────────────────────────────
interface TermLine {
    id: number
    text: string
    isError: boolean
}

let lineCounter = 0

// ─── Props ────────────────────────────────────────────────────────────────────
export interface TerminalPanelProps {
    /** Called when the user hits "Send to AI Fix" */
    onSendToAiFix?: (errorText: string, detectedFilePath?: string) => void
    /** Called with terminal scrollback snapshots for AI context */
    onOutputSnapshot?: (outputText: string) => void
    /** Initial command to populate the input (optional) */
    initialCommand?: string
    /** Initial working directory (optional) */
    initialCwd?: string
    /** Max lines to keep in the scrollback buffer (default: 2000) */
    maxLines?: number
}

// Ref handle so a parent can programmatically inject an error
export interface TerminalPanelHandle {
    injectError(text: string): void
}

// ─── Component ────────────────────────────────────────────────────────────────
const TerminalPanel = forwardRef<TerminalPanelHandle, TerminalPanelProps>(
    ({ onSendToAiFix, onOutputSnapshot, initialCommand = '', initialCwd = '', maxLines = 2000 }, ref) => {

        const [command, setCommand] = useState(initialCommand)
        const [cwd, setCwd] = useState(initialCwd)
        const [lines, setLines] = useState<TermLine[]>([])
        const [running, setRunning] = useState(false)
        const [exitCode, setExitCode] = useState<number | null>(null)
        const [selectedError, setSelectedError] = useState<string>('')
        const [detectedFile, setDetectedFile] = useState<string | undefined>(undefined)
        const [selectionMode, setSelectionMode] = useState(false)
        const [selectedLineIds, setSelectedLineIds] = useState<Set<number>>(new Set())

        const sessionIdRef = useRef(makeSessionId())
        const runningRef = useRef(false)
        const outputRef = useRef<HTMLDivElement | null>(null)
        const autoScrollRef = useRef(true)

        const electronAvailable = typeof window !== 'undefined' && !!(window as any).api

        // Keep an always-fresh reference for unmount cleanup.
        useEffect(() => {
            runningRef.current = running
        }, [running])

        // ── Expose handle ─────────────────────────────────────────────────────────
        useImperativeHandle(ref, () => ({
            injectError(text: string) {
                appendRaw(`\n[Injected error]\n${text}\n`)
            },
        }))

        // ── Append raw text to line buffer ────────────────────────────────────────
        const appendRaw = useCallback((raw: string) => {
            const clean = stripAnsi(raw)
            const newLines: TermLine[] = clean
                .split('\n')
                .filter((_, i, arr) => i < arr.length - 1 || _) // drop trailing empty
                .map(text => ({
                    id: ++lineCounter,
                    text,
                    isError: looksLikeError(text),
                }))

            setLines(prev => {
                const combined = [...prev, ...newLines]
                return combined.length > maxLines ? combined.slice(-maxLines) : combined
            })
        }, [maxLines])

        // ── Auto-scroll ───────────────────────────────────────────────────────────
        useEffect(() => {
            if (!autoScrollRef.current || !outputRef.current) return
            outputRef.current.scrollTop = outputRef.current.scrollHeight
        }, [lines])

        // ── Subscribe to terminal events ──────────────────────────────────────────
        useEffect(() => {
            const sid = sessionIdRef.current
            const unData = terminalService.onData(sid, data => appendRaw(data))
            const unExit = terminalService.onExit(sid, code => {
                setRunning(false)
                setExitCode(code)
                appendRaw(`\n[Process exited with code ${code ?? '?'}]\n`)
            })
            return () => {
                unData()
                unExit()
                // If the user switches activities, we unmount the panel (via `key`)
                // so we should also stop any in-flight process for that session.
                if (runningRef.current) {
                    void terminalService.kill(sid).catch(() => { })
                }
                terminalService.cleanup(sid)
            }
        }, [appendRaw])

        // ── Run command ───────────────────────────────────────────────────────────
        const handleRun = useCallback(async () => {
            if (!command.trim()) return
            setLines([])
            setExitCode(null)
            setSelectedError('')
            setDetectedFile(undefined)
            setSelectedLineIds(new Set())
            setSelectionMode(false)
            setRunning(true)

            appendRaw(`$ ${command}\n`)

            const res = await terminalService.spawn(sessionIdRef.current, command.trim(), cwd || undefined)
            if (!res.ok) {
                appendRaw(`[Error: ${res.message}]\n`)
                setRunning(false)
            }
        }, [command, cwd, appendRaw])

        // ── Kill ──────────────────────────────────────────────────────────────────
        const handleKill = useCallback(async () => {
            await terminalService.kill(sessionIdRef.current)
        }, [])

        // ── Pick working directory ────────────────────────────────────────────────
        const handlePickCwd = useCallback(async () => {
            const res = await injectService.selectDirectory()
            if (res.ok && res.path) setCwd(res.path)
        }, [])

        // ── Selection mode: toggle line in selection ──────────────────────────────
        const toggleLineSelection = useCallback((id: number) => {
            setSelectedLineIds(prev => {
                const next = new Set(prev)
                if (next.has(id)) next.delete(id)
                else next.add(id)
                return next
            })
        }, [])

        // ── Build error text from selected lines ──────────────────────────────────
        const buildSelectedText = useCallback(() => {
            const text = lines
                .filter(l => selectedLineIds.has(l.id))
                .map(l => l.text)
                .join('\n')
            return text
        }, [lines, selectedLineIds])

        // ── Auto-select all error lines ───────────────────────────────────────────
        const autoSelectErrors = useCallback(() => {
            const errorIds = new Set(lines.filter(l => l.isError).map(l => l.id))
            setSelectedLineIds(errorIds)
            setSelectionMode(true)
        }, [lines])

        // ── Send selection to AI fix ──────────────────────────────────────────────
        const handleSendToAiFix = useCallback(() => {
            const text = selectionMode ? buildSelectedText() : selectedError
            if (!text.trim()) return
            const filePath = detectedFile || extractFilePath(text)
            setDetectedFile(filePath)
            onSendToAiFix?.(text, filePath)
        }, [selectionMode, buildSelectedText, selectedError, detectedFile, onSendToAiFix])

        // ── Copy all output ───────────────────────────────────────────────────────
        const handleCopyAll = useCallback(() => {
            const text = lines.map(l => l.text).join('\n')
            navigator.clipboard?.writeText(text)
        }, [lines])

        // ── Clear ─────────────────────────────────────────────────────────────────
        const handleClear = useCallback(() => {
            setLines([])
            setSelectedError('')
            setDetectedFile(undefined)
            setSelectedLineIds(new Set())
        }, [])

        // ── Count error lines ─────────────────────────────────────────────────────
        const errorCount = lines.filter(l => l.isError).length

        // Keep a compact output snapshot available to parent panels.
        useEffect(() => {
            if (!onOutputSnapshot) return
            const text = lines.map(l => l.text).join('\n')
            onOutputSnapshot(text.slice(-12000))
        }, [lines, onOutputSnapshot])

        // ── Render ────────────────────────────────────────────────────────────────
        return (
            <div className="bg-[#141420] rounded-lg border border-[#2a2a3e] flex flex-col" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace" }}>

                {/* ── Header ── */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-[#2a2a3e] bg-[#1a1a2e]">
                    {/* Traffic-light dots */}
                    <div className="flex gap-1.5 flex-shrink-0">
                        <span className="w-3 h-3 rounded-full bg-red-500/80" />
                        <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                        <span className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <span className="text-[11px] text-[#6b6b8a] font-semibold tracking-widest uppercase ml-1">Terminal</span>
                    {running && (
                        <span className="ml-auto flex items-center gap-1.5 text-[10px] text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            running
                        </span>
                    )}
                    {!running && exitCode !== null && (
                        <span className={`ml-auto text-[10px] font-mono ${exitCode === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            exit {exitCode}
                        </span>
                    )}
                    {errorCount > 0 && (
                        <button
                            onClick={autoSelectErrors}
                            className="ml-auto flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-red-900/40 border border-red-700/60 text-red-300 hover:bg-red-800/50 transition-colors"
                            title="Auto-select all error lines"
                        >
                            <span>⚠</span>
                            {errorCount} error{errorCount !== 1 ? 's' : ''} detected
                        </button>
                    )}
                </div>

                {/* ── Command input row ── */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-[#2a2a3e] bg-[#16162a]">
                    <span className="text-emerald-400 text-sm flex-shrink-0 select-none">$</span>
                    <input
                        className="flex-1 bg-transparent text-[#e0e0ff] text-sm outline-none placeholder-[#3a3a5a] min-w-0"
                        placeholder="Enter command… (e.g. npm run dev)"
                        value={command}
                        onChange={e => setCommand(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !running) handleRun() }}
                        spellCheck={false}
                    />
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        {!running ? (
                            <button
                                onClick={handleRun}
                                disabled={!command.trim() || !electronAvailable}
                                className={`px-3 py-1 rounded text-xs font-semibold transition-all
                                ${command.trim() && electronAvailable
                                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow shadow-emerald-900/50'
                                        : 'bg-[#2a2a3e] text-[#4a4a6a] cursor-not-allowed'}`}
                            >
                                ▶ Run
                            </button>
                        ) : (
                            <button
                                onClick={handleKill}
                                className="px-3 py-1 rounded text-xs font-semibold bg-red-700 hover:bg-red-600 text-white transition-colors"
                            >
                                ■ Stop
                            </button>
                        )}
                    </div>
                </div>

                {/* ── CWD row ── */}
                <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#2a2a3e] bg-[#13132. text-[10px]" style={{ backgroundColor: '#131328' }}>
                    <span className="text-[#4a4a6a] flex-shrink-0">📁 cwd:</span>
                    <span className="text-[#5a5a8a] truncate flex-1 min-w-0">{cwd || '(default)'}</span>
                    <button
                        onClick={handlePickCwd}
                        disabled={!electronAvailable}
                        className="flex-shrink-0 text-[#5a5a9a] hover:text-[#9a9ade] text-[10px] transition-colors"
                    >
                        change
                    </button>
                </div>

                {/* ── Toolbar ── */}
                <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#2a2a3e] bg-[#141420]">
                    <button
                        onClick={() => setSelectionMode(s => !s)}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-colors
                        ${selectionMode
                                ? 'bg-indigo-700/50 border-indigo-500/50 text-indigo-200'
                                : 'bg-[#1e1e38] border-[#2a2a4a] text-[#5a5a8a] hover:text-[#9a9ade]'}`}
                        title="Toggle line-selection mode — click lines to select them"
                    >
                        {selectionMode ? '✓ Select mode' : '⊡ Select lines'}
                    </button>

                    {selectionMode && selectedLineIds.size > 0 && (
                        <span className="text-[10px] text-indigo-300">
                            {selectedLineIds.size} line{selectedLineIds.size !== 1 ? 's' : ''} selected
                        </span>
                    )}

                    <div className="ml-auto flex items-center gap-1.5">
                        <button
                            onClick={handleClear}
                            className="text-[10px] text-[#4a4a6a] hover:text-[#8a8aae] transition-colors"
                        >
                            Clear
                        </button>
                        <button
                            onClick={handleCopyAll}
                            className="text-[10px] text-[#4a4a6a] hover:text-[#8a8aae] transition-colors"
                        >
                            Copy all
                        </button>
                    </div>
                </div>

                {/* ── Output area ── */}
                <div
                    ref={outputRef}
                    onScroll={e => {
                        const el = e.currentTarget
                        autoScrollRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40
                    }}
                    className="flex-1 overflow-y-auto px-3 py-2 space-y-px"
                    style={{ minHeight: 200, maxHeight: 360, backgroundColor: '#0d0d1a' }}
                >
                    {lines.length === 0 && !running && (
                        <div className="text-[#2e2e4e] text-xs italic pt-4 text-center select-none">
                            Output will appear here…
                        </div>
                    )}
                    {lines.map(line => {
                        const isSelected = selectedLineIds.has(line.id)
                        return (
                            <div
                                key={line.id}
                                onClick={() => selectionMode && toggleLineSelection(line.id)}
                                className={`
                                text-[12px] leading-5 font-mono whitespace-pre-wrap break-all rounded px-1
                                transition-colors duration-75
                                ${selectionMode ? 'cursor-pointer' : ''}
                                ${isSelected
                                        ? 'bg-indigo-700/40 text-indigo-100'
                                        : line.isError
                                            ? 'text-red-300'
                                            : 'text-[#9090b0]'
                                    }
                                ${selectionMode && !isSelected ? 'hover:bg-[#1e1e3a]' : ''}
                            `}
                            >
                                {selectionMode && (
                                    <span className={`mr-1.5 text-[10px] ${isSelected ? 'text-indigo-300' : 'text-[#2e2e4e]'}`}>
                                        {isSelected ? '■' : '□'}
                                    </span>
                                )}
                                {line.text || '\u00A0'}
                            </div>
                        )
                    })}
                    {running && (
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-500/70 pt-1">
                            <span className="animate-spin">⟳</span>
                            <span>running…</span>
                        </div>
                    )}
                </div>

                {/* ── Send-to-AI strip (visible when lines are selected or error detected) ── */}
                {(selectionMode && selectedLineIds.size > 0) && (
                    <div className="border-t border-[#2a2a3e] bg-[#16162a] px-3 py-2 space-y-2">
                        {/* Detected file path (editable) */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[#5a5a8a] flex-shrink-0">File:</span>
                            <input
                                className="flex-1 bg-[#0d0d1a] border border-[#2a2a4a] rounded px-2 py-0.5 text-[11px] text-[#c0c0e0] outline-none focus:border-indigo-500 min-w-0"
                                placeholder="Auto-detected or paste a file path…"
                                value={detectedFile ?? extractFilePath(buildSelectedText()) ?? ''}
                                onChange={e => setDetectedFile(e.target.value || undefined)}
                            />
                            <button
                                onClick={async () => {
                                    const res = await injectService.selectFile()
                                    if (res.ok && res.path) setDetectedFile(res.path)
                                }}
                                disabled={!electronAvailable}
                                className="flex-shrink-0 text-[10px] px-2 py-0.5 rounded bg-[#1e1e3a] border border-[#2a2a4a] text-[#7a7aaa] hover:text-[#aaaad0] transition-colors"
                            >
                                Browse
                            </button>
                        </div>

                        {/* Preview of selected text */}
                        <div className="bg-[#0d0d1a] rounded border border-[#2a2a3e] px-2 py-1.5 text-[10px] text-red-300/80 font-mono max-h-20 overflow-y-auto whitespace-pre-wrap break-all">
                            {buildSelectedText() || <span className="text-[#3a3a5a] italic">No lines selected</span>}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleSendToAiFix}
                                disabled={selectedLineIds.size === 0}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-semibold transition-all
                                ${selectedLineIds.size > 0
                                        ? 'bg-purple-600 hover:bg-purple-500 text-white shadow shadow-purple-900/50'
                                        : 'bg-[#2a2a3e] text-[#4a4a6a] cursor-not-allowed'}`}
                            >
                                🤖 Send to AI Fix
                            </button>
                            <button
                                onClick={() => { setSelectedLineIds(new Set()); setSelectionMode(false) }}
                                className="text-[11px] text-[#4a4a6a] hover:text-[#8a8aae] transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {!electronAvailable && (
                    <div className="px-3 py-2 border-t border-[#2a2a3e] text-[10px] text-yellow-400/70">
                        ⚠ Terminal requires the Electron desktop app — start with <code className="font-mono">npm run dev:app</code>
                    </div>
                )}
            </div>
        )
    })

TerminalPanel.displayName = 'TerminalPanel'
export default TerminalPanel