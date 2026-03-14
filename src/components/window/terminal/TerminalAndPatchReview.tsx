/**
 * INTEGRATION EXAMPLE
 * ───────────────────
 * This shows how to wire TerminalPanel into your existing layout so that
 * when the user clicks "Send to AI Fix" in the terminal, the error + file path
 * flow automatically into PatchReview's AI fix generation.
 *
 * You can drop this into whatever parent component wraps PatchReview today
 * (e.g. a sidebar tab, a main panel, or a split-pane layout).
 */

import React, { useRef, useState, useCallback } from 'react'
import TerminalPanel, { type TerminalPanelHandle } from './TerminalPanel'

// ── Import your existing PatchReview and the AI service ──────────────────────
// (adjust paths to match your project structure)
import PatchReviewWithBoundary from '../ai/PatchReview'
import { generateAiCodeFix, type AiRequestSummary } from '../../../services/aiService'
import injectService from '../../../services/injectService'

// ─── Integrated view ──────────────────────────────────────────────────────────
export default function TerminalAndPatchView() {

    const terminalRef = useRef<TerminalPanelHandle>(null)

    // Shared state: when the terminal surfaces an error we store it here so
    // PatchReview can pick it up when the user clicks "Generate AI Fix".
    const [pendingError, setPendingError]       = useState<string>('')
    const [pendingFilePath, setPendingFilePath] = useState<string | undefined>(undefined)
    const [aiMessage, setAiMessage]             = useState<string | null>(null)
    const [generating, setGenerating]           = useState(false)

    /**
     * Called by TerminalPanel when the user clicks "Send to AI Fix".
     * We store the error, auto-fill the file path, and optionally
     * kick off the AI fix automatically.
     */
    const handleSendToAiFix = useCallback(async (errorText: string, detectedFilePath?: string) => {
        setPendingError(errorText)
        setPendingFilePath(detectedFilePath)
        setAiMessage(`📋 Error captured from terminal.${detectedFilePath ? ` Detected file: ${detectedFilePath}` : ' Please select a file in Patch Review.'}`)

        // ── Optional: auto-generate the AI fix immediately if we have a file ──
        if (detectedFilePath) {
            const fileRes = await injectService.readFile(detectedFilePath)
            if (fileRes.ok && fileRes.content !== undefined) {
                setGenerating(true)
                setAiMessage('🤖 Generating AI fix from terminal error…')
                try {
                    // Build a minimal "request" — use the terminal error as the body
                    const fakeRequest: AiRequestSummary = {
                        method: 'TERMINAL',
                        url:    detectedFilePath,
                        headers: {},
                        body:   errorText,
                    }
                    const fixed = await generateAiCodeFix({
                        request:     fakeRequest,
                        filePath:    detectedFilePath,
                        fileContent: fileRes.content,
                        errorMessage: errorText,
                    })

                    // Write the fixed code back to disk
                    const writeRes = await injectService.writeFile(detectedFilePath, fixed)
                    setAiMessage(writeRes.ok
                        ? `✅ AI fix applied to ${detectedFilePath}`
                        : `⚠ Fix generated but write failed: ${writeRes.message}`)
                } catch (e: any) {
                    setAiMessage(`❌ AI fix failed: ${e?.message}`)
                } finally {
                    setGenerating(false)
                }
            }
        }
    }, [])

    return (
        <div className="flex flex-col gap-4 p-4 bg-[#0f0f1e] min-h-screen">

            {/* ── Status banner (shown when terminal has sent an error) ── */}
            {aiMessage && (
                <div className={`text-xs rounded px-3 py-2 border flex items-center gap-2
                    ${generating
                        ? 'bg-purple-900/30 border-purple-700/50 text-purple-300'
                        : aiMessage.startsWith('✅')
                            ? 'bg-emerald-900/30 border-emerald-700/50 text-emerald-300'
                            : aiMessage.startsWith('❌')
                                ? 'bg-red-900/30 border-red-700/50 text-red-300'
                                : 'bg-blue-900/30 border-blue-700/50 text-blue-300'}`}
                >
                    {generating && <span className="animate-spin">⟳</span>}
                    <span>{aiMessage}</span>
                    <button onClick={() => setAiMessage(null)} className="ml-auto opacity-50 hover:opacity-100">✕</button>
                </div>
            )}

            {/* ── Terminal panel ── */}
            <TerminalPanel
                ref={terminalRef}
                onSendToAiFix={handleSendToAiFix}
                initialCwd=""
            />

            {/* ── Divider ── */}
            <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#2a2a3e]" />
                <span className="text-[10px] text-[#3a3a5a] uppercase tracking-widest">Patch Review</span>
                <div className="flex-1 h-px bg-[#2a2a3e]" />
            </div>

            {/* ── PatchReview ── */}
            {/*
                PatchReview already reads `selectedActivityId` from Redux for its
                request/response context. If you want the terminal error to
                pre-populate the AI fix prompt, pass it via `errorMessage` or
                extend PatchReview to accept a `prefilledError` prop.
                See the note in pendingError / pendingFilePath above.
            */}
            <PatchReviewWithBoundary />

            {/* Debug strip (remove in production) */}
            {pendingError && (
                <details className="text-[10px] text-[#3a3a5a] border border-[#2a2a3e] rounded p-2">
                    <summary className="cursor-pointer">Pending terminal error (debug)</summary>
                    <pre className="whitespace-pre-wrap mt-1 text-red-400/60 font-mono">{pendingError}</pre>
                    {pendingFilePath && <div className="mt-1 text-blue-400/60">File: {pendingFilePath}</div>}
                </details>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// ALTERNATIVE: if you want to keep PatchReview standalone and just add the
// terminal as a new tab in your existing tab system, do this instead:
//
//   <TerminalPanel
//     onSendToAiFix={(error, filePath) => {
//       // switch to the Patch Review tab, then
//       dispatch(setSelectedErrorFromTerminal({ error, filePath }))
//     }}
//   />
//
// And in PatchReview, read `selectedErrorFromTerminal` from Redux to
// pre-populate `fileContent` + pass `errorMessage` to `generateAiCodeFix`.
// ─────────────────────────────────────────────────────────────────────────────