// import React, { useState, useEffect, useRef } from "react";
// import { useSelector } from "react-redux";
// import injectService from "../../../services/injectService";
// import { generateAiCodeFix, type AiRequestSummary, type AiResponseSummary } from "../../../services/aiService";
// import type { RootState } from "../../../state/store";
// import type { ActivityModel } from "../../../models/ActivityModel";
// import type { RequestModel, ResponseModel } from "../../../models";
// import * as monaco from 'monaco-editor';

// const PatchReview: React.FC = () => {
//     const [patchText, setPatchText] = useState("");
//     const [previewing, setPreviewing] = useState(false);
//     const [applying, setApplying] = useState(false);
//     const [files, setFiles] = useState<Array<{ path: string; status: 'modify' | 'add' | 'delete' }>>([]);
//     const [message, setMessage] = useState<string | null>(null);
//     const [selectedDir, setSelectedDir] = useState<string>("");
//     const [selectedFile, setSelectedFile] = useState<string>("");
//     const [fileContent, setFileContent] = useState<string>("");
//     const [fixedCode, setFixedCode] = useState<string>("");
//     const [generatingFix, setGeneratingFix] = useState(false);
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     const [hardcodedContent, _setHardcodedContent] = useState<string>("// Example hardcoded code\nexport const hello = () => console.log('Hello from injected code');\n");
//     const containerRef = useRef<HTMLDivElement | null>(null);
//     const diffEditorRef = useRef<monaco.editor.IStandaloneDiffEditor | null>(null);
//     const originalModelRef = useRef<monaco.editor.ITextModel | null>(null);
//     const modifiedModelRef = useRef<monaco.editor.ITextModel | null>(null);

//     // Get current activity from Redux
//     const selectedActivityId = useSelector((state: RootState) => state.activities.selectedActivityId);
//     const activities = useSelector((state: RootState) => state.activities.activities as ActivityModel[]);
//     const currentActivity = activities.find((a) => a.id === selectedActivityId);
//     const currentRequest: RequestModel | undefined = currentActivity?.request;
//     const currentResponse: ResponseModel | null = (currentActivity?.response as ResponseModel | undefined) ?? null;
//     const electronAvailable = typeof window !== 'undefined' && (window as any).api;

//     // Helper function to get language from file extension
//     const getLanguageFromPath = (filePath: string): string => {
//         const ext = filePath.split('.').pop()?.toLowerCase();
//         const langMap: Record<string, string> = {
//             'ts': 'typescript',
//             'tsx': 'typescript',
//             'js': 'javascript',
//             'jsx': 'javascript',
//             'py': 'python',
//             'java': 'java',
//             'cpp': 'cpp',
//             'c': 'c',
//             'cs': 'csharp',
//             'go': 'go',
//             'rs': 'rust',
//             'php': 'php',
//             'rb': 'ruby',
//             'swift': 'swift',
//             'kt': 'kotlin',
//             'html': 'html',
//             'css': 'css',
//             'json': 'json',
//             'xml': 'xml',
//             'yaml': 'yaml',
//             'yml': 'yaml',
//         };
//         return langMap[ext || ''] || 'plaintext';
//     };

//     // Initialize Monaco diff editor
//     useEffect(() => {
//         if (!containerRef.current) return;

//         // CREATE editor only AFTER DOM exists
//         diffEditorRef.current = monaco.editor.createDiffEditor(
//             containerRef.current,
//             {
//                 theme: "vs-dark",
//                 automaticLayout: true,
//                 renderSideBySide: true,
//             }
//         );

//         originalModelRef.current = monaco.editor.createModel(
//             "",
//             "plaintext"
//         );

//         modifiedModelRef.current = monaco.editor.createModel(
//             "",
//             "plaintext"
//         );

//         diffEditorRef.current.setModel({
//             original: originalModelRef.current,
//             modified: modifiedModelRef.current,
//         });

//         // Cleanup (VERY important in React)
//         return () => {
//             // Store refs locally to avoid race conditions
//             const editor = diffEditorRef.current;
//             const originalModel = originalModelRef.current;
//             const modifiedModel = modifiedModelRef.current;

//             // Clear refs first to prevent further access
//             diffEditorRef.current = null;
//             originalModelRef.current = null;
//             modifiedModelRef.current = null;

//             // Dispose diff editor first (this releases its reference to models)
//             if (editor) {
//                 try {
//                     editor.dispose();
//                 } catch (e) {
//                     // Editor might already be disposed, ignore
//                 }
//             }

//             // Then dispose models separately
//             if (originalModel) {
//                 try {
//                     originalModel.dispose();
//                 } catch (e) {
//                     // Model might already be disposed, ignore
//                 }
//             }

//             if (modifiedModel) {
//                 try {
//                     modifiedModel.dispose();
//                 } catch (e) {
//                     // Model might already be disposed, ignore
//                 }
//             }
//         };
//     }, []);

//     // Load file content when selectedFile changes
//     useEffect(() => {
//         const loadFileContent = async () => {
//             if (!selectedFile || !electronAvailable) {
//                 setFileContent("");
//                 return;
//             }

//             try {
//                 const res = await injectService.readFile(selectedFile);
//                 if (res.ok && res.content !== undefined) {
//                     setFileContent(res.content);
//                     // Update original model with file content
//                     if (originalModelRef.current) {
//                         const language = getLanguageFromPath(selectedFile);
//                         originalModelRef.current.setValue(res.content);
//                         monaco.editor.setModelLanguage(originalModelRef.current, language);
//                     }
//                     // Clear fixed code when loading new file
//                     setFixedCode("");
//                     if (modifiedModelRef.current) {
//                         modifiedModelRef.current.setValue("");
//                     }
//                 } else {
//                     setMessage(res.message || "Failed to read file");
//                     setFileContent("");
//                 }
//             } catch (error) {
//                 console.error('Failed to load file content', error);
//                 setMessage("Unexpected error while reading file. See console for details.");
//                 setFileContent("");
//             }
//         };

//         loadFileContent();
//     }, [selectedFile, electronAvailable]);

//     // Update diff editor when fileContent or fixedCode changes
//     useEffect(() => {
//         if (!diffEditorRef.current || !originalModelRef.current || !modifiedModelRef.current) return;

//         if (selectedFile) {
//             const language = getLanguageFromPath(selectedFile);

//             // Update original model
//             originalModelRef.current.setValue(fileContent || "");
//             monaco.editor.setModelLanguage(originalModelRef.current, language);

//             // Update modified model with fixed code if available
//             if (fixedCode) {
//                 modifiedModelRef.current.setValue(fixedCode);
//                 monaco.editor.setModelLanguage(modifiedModelRef.current, language);
//             } else {
//                 modifiedModelRef.current.setValue("");
//             }

//             diffEditorRef.current.setModel({
//                 original: originalModelRef.current,
//                 modified: modifiedModelRef.current,
//             });
//         }
//     }, [fileContent, fixedCode, selectedFile]);
//     const handlePreview = async () => {
//         setMessage(null);
//         setPreviewing(true);
//         try {
//             const res = await injectService.previewPatch(patchText);
//             if (res.ok) {
//                 setFiles(res.files || []);
//             } else {
//                 setMessage(res.message || "Failed to preview patch");
//             }
//         } catch (error) {
//             console.error('handlePreview failed', error);
//             setMessage("Unexpected error while previewing patch. See console for details.");
//         } finally {
//             setPreviewing(false);
//         }
//     };

//     const handleAccept = async () => {
//         setMessage(null);
//         setApplying(true);
//         try {
//             // If we have fixed code from AI, write that; otherwise use the existing logic
//             if (selectedFile && fixedCode) {
//                 const writeRes = await injectService.writeFile(selectedFile, fixedCode);
//                 if (writeRes.ok) {
//                     setMessage(`Applied AI fix to: ${selectedFile}`);
//                     setFileContent(fixedCode); // Update local content
//                     setFixedCode(""); // Clear fixed code after applying
//                 } else {
//                     setMessage(writeRes.message || 'Failed to write file');
//                 }
//             } else if (selectedFile) {
//                 const writeRes = await injectService.writeFile(selectedFile, hardcodedContent);
//                 setMessage(writeRes.ok ? `Wrote file: ${selectedFile}` : writeRes.message || 'Failed to write file');
//             } else if (selectedDir) {
//                 const target = `${selectedDir.replace(/\\+$/, '')}/injected.ts`;
//                 const writeRes = await injectService.writeFile(target, hardcodedContent);
//                 setMessage(writeRes.ok ? `Wrote file: ${target}` : writeRes.message || 'Failed to write file');
//             } else {
//                 const res = await injectService.applyPatch(patchText);
//                 if (res.ok) {
//                     setMessage(`Applied successfully${res.written && res.written.length ? `: ${res.written.length} file(s)` : ''}`);
//                     setFiles([]);
//                     setPatchText("");
//                 } else {
//                     setMessage(res.message || "Failed to apply patch");
//                 }
//             }
//         } catch (error) {
//             console.error('handleAccept failed', error);
//             setMessage("Unexpected error while applying patch. See console for details.");
//         } finally {
//             setApplying(false);
//         }
//     };

//     const handleReject = () => {
//         setFiles([]);
//         setMessage("Discarded patch");
//     };

//     return (
//         <div className="bg-[#2a2a3a] rounded-lg p-4 space-y-3">
//             <h3 className="text-lg font-semibold text-white">Patch Review</h3>
//             {!electronAvailable && (
//                 <div className="text-xs text-yellow-300 bg-yellow-900/40 border border-yellow-800 rounded p-2">
//                     File chooser and write require the Electron desktop app. Start with "npm run dev:app".
//                 </div>
//             )}
//             <p className="text-gray-300 text-sm">Select a file to view its content and generate AI-powered fixes based on the current request/response.</p>
//             {!currentRequest && (
//                 <div className="text-xs text-amber-300 bg-amber-900/40 border border-amber-800 rounded p-2">
//                     No request selected. Select or create a request to generate AI fixes.
//                 </div>
//             )}
//             <div className="flex flex-wrap items-center gap-2">
//                 <button
//                     onClick={async () => {
//                         try {
//                             const res = await injectService.selectDirectory();
//                             if (res.ok && res.path) setSelectedDir(res.path);
//                             else if (!res.ok && res.message) setMessage(res.message);
//                         } catch (error) {
//                             console.error('selectDirectory handler failed', error);
//                             setMessage("Unexpected error while selecting directory. See console for details.");
//                         }
//                     }}
//                     disabled={!electronAvailable}
//                     className={`px-3 py-1.5 rounded ${electronAvailable ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-gray-600'} text-white text-sm`}
//                 >Choose Folder</button>
//                 <button
//                     onClick={async () => {
//                         try {
//                             const res = await injectService.selectFile(selectedDir || undefined);
//                             if (res.ok && res.path) {
//                                 setSelectedFile(res.path);
//                                 setFixedCode(""); // Clear previous fixed code
//                             } else if (!res.ok && res.message) setMessage(res.message);
//                         } catch (error) {
//                             console.error('selectFile handler failed', error);
//                             setMessage("Unexpected error while selecting file. See console for details.");
//                         }
//                     }}
//                     disabled={!electronAvailable}
//                     className={`px-3 py-1.5 rounded ${electronAvailable ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-gray-600'} text-white text-sm`}
//                 >Choose File</button>
//                 <button
//                     onClick={async () => {
//                         if (!selectedFile || !currentRequest) {
//                             setMessage("Please select a file and ensure a request is available.");
//                             return;
//                         }

//                         setMessage(null);
//                         setGeneratingFix(true);

//                         try {
//                             const requestSummary: AiRequestSummary = {
//                                 method: currentRequest.method,
//                                 url: currentRequest.url,
//                                 headers: currentRequest.headers || {},
//                                 body: currentRequest.body || "",
//                             };

//                             const responseSummary: AiResponseSummary | undefined = currentResponse ? {
//                                 status: currentResponse.status,
//                                 statusText: currentResponse.statusText,
//                                 headers: currentResponse.headers || {},
//                                 body: currentResponse.body || "",
//                             } : undefined;

//                             const fixed = await generateAiCodeFix({
//                                 request: requestSummary,
//                                 response: responseSummary,
//                                 filePath: selectedFile,
//                                 fileContent: fileContent,
//                                 activityName: currentActivity?.name,
//                                 activityId: currentActivity?.id,
//                             });

//                             setFixedCode(fixed);
//                             setMessage("AI fix generated successfully!");
//                         } catch (error) {
//                             console.error('Failed to generate AI fix', error);
//                             setMessage("Failed to generate AI fix. See console for details.");
//                         } finally {
//                             setGeneratingFix(false);
//                         }
//                     }}
//                     disabled={!selectedFile || !currentRequest || !fileContent || generatingFix || !electronAvailable}
//                     className={`px-3 py-1.5 rounded ${(!selectedFile || !currentRequest || !fileContent || generatingFix || !electronAvailable) ? 'bg-gray-600' : 'bg-purple-600 hover:bg-purple-500'} text-white text-sm`}
//                 >
//                     {generatingFix ? 'Generating Fix...' : '🤖 Generate AI Fix'}
//                 </button>
//                 {selectedDir && <span className="text-xs text-gray-300">Folder: {selectedDir}</span>}
//                 {selectedFile && <span className="text-xs text-gray-300">File: {selectedFile}</span>}
//             </div>
//             {/* <div className="space-y-2">
//                 <div className="text-white font-medium text-sm">Hardcoded Code</div>
//                 <textarea
//                     className="w-full h-28 bg-[#1f1f2e] text-gray-200 p-2 rounded resize-y outline-none"
//                     value={hardcodedContent}
//                     onChange={(e) => setHardcodedContent(e.target.value)}
//                 />
//             </div> */}

//             <div
//                 ref={containerRef}
//                 className="w-full h-[400px] rounded border border-gray-700"
//             />
//             <textarea
//                 className="w-full h-40 bg-[#1f1f2e] text-gray-200 p-2 rounded resize-y outline-none"
//                 placeholder={`Example:\n--- a/src/foo.ts\n+++ b/src/foo.ts\n@@ -1,2 +1,2 @@\n- old\n+ new`}
//                 value={patchText}
//                 onChange={(e) => setPatchText(e.target.value)}
//             />
//             <div className="flex items-center gap-2">
//                 <button
//                     disabled={!patchText.trim() || previewing}
//                     onClick={handlePreview}
//                     className={`px-3 py-1.5 rounded ${previewing ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-500'} text-white text-sm`}
//                 >
//                     {previewing ? 'Previewing…' : 'Preview'}
//                 </button>
//                 <button
//                     disabled={applying || !(fixedCode || patchText.trim())}
//                     onClick={handleAccept}
//                     className={`px-3 py-1.5 rounded ${(applying || !(fixedCode || patchText.trim())) ? 'bg-gray-600' : 'bg-green-600 hover:bg-green-500'} text-white text-sm`}
//                 >
//                     {applying ? 'Applying…' : fixedCode ? 'Apply AI Fix ✅' : 'Apply Change ✅'}
//                 </button>
//                 <button
//                     disabled={!files.length}
//                     onClick={handleReject}
//                     className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white text-sm"
//                 >
//                     Reject ❌
//                 </button>
//             </div>
//             {message && <div className="text-xs text-gray-300">{message}</div>}
//             {!!files.length && (
//                 <div className="mt-2">
//                     <div className="text-white font-medium text-sm mb-1">Files affected</div>
//                     <ul className="space-y-1">
//                         {files.map((f, idx) => (
//                             <li key={idx} className="text-xs text-gray-300 flex items-center gap-2">
//                                 <span
//                                     className={`px-1.5 py-0.5 rounded text-[10px] uppercase ${f.status === 'add' ? 'bg-green-700' : f.status === 'delete' ? 'bg-red-700' : 'bg-blue-700'
//                                         }`}
//                                 >{f.status}</span>
//                                 <span className="truncate">{f.path}</span>
//                             </li>
//                         ))}
//                     </ul>
//                 </div>
//             )}
//         </div>
//     );
// }

// export default PatchReview;




import React, { useState, useEffect, useRef, useCallback, Component } from "react";
import { useSelector } from "react-redux";

// ─── Error Boundary (catches Monaco exceptions that escape into React) ────────
class EditorErrorBoundary extends Component<
    { children: React.ReactNode },
    { hasError: boolean; error: string }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: '' };
    }
    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error: error.message };
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="bg-red-900/40 border border-red-700 rounded p-4 text-sm text-red-300 space-y-2">
                    <div className="font-semibold">Editor crashed — please reload the panel.</div>
                    <div className="text-xs text-red-400 font-mono">{this.state.error}</div>
                    <button
                        onClick={() => this.setState({ hasError: false, error: '' })}
                        className="px-3 py-1 rounded bg-red-700 hover:bg-red-600 text-white text-xs"
                    >Retry</button>
                </div>
            );
        }
        return this.props.children;
    }
}

import injectService from "../../../services/injectService";
import { generateAiCodeFix, type AiRequestSummary, type AiResponseSummary } from "../../../services/aiService";
import type { RootState } from "../../../state/store";
import type { ActivityModel } from "../../../models/ActivityModel";
import type { RequestModel, ResponseModel } from "../../../models";
import * as monaco from 'monaco-editor';

// ─── Timeline Types ───────────────────────────────────────────────────────────

type SnapshotSource = 'original' | 'ai-fix' | 'manual' | 'applied';

interface TimelineSnapshot {
    id: string;
    label: string;
    source: SnapshotSource;
    content: string;
    timestamp: number;
    filePath: string;
}

interface FileTimeline {
    snapshots: TimelineSnapshot[];
    currentIndex: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SOURCE_META: Record<SnapshotSource, { color: string; icon: string }> = {
    original: { color: 'bg-slate-600', icon: '📄' },
    'ai-fix': { color: 'bg-purple-700', icon: '🤖' },
    manual: { color: 'bg-blue-700', icon: '✏️' },
    applied: { color: 'bg-green-700', icon: '✅' },
};

function makeId() {
    return Math.random().toString(36).slice(2, 10);
}

interface PatchReviewProps {
    preselectedFile?: string;
    activityId?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const PatchReview: React.FC<PatchReviewProps> = ({ preselectedFile, activityId }) => {
    const [patchText, setPatchText] = useState("");
    const [previewing, setPreviewing] = useState(false);
    const [applying, setApplying] = useState(false);
    const [files, setFiles] = useState<Array<{ path: string; status: 'modify' | 'add' | 'delete' }>>([]);
    const [message, setMessage] = useState<string | null>(null);
    const [selectedDir, setSelectedDir] = useState<string>("");
    const [selectedFile, setSelectedFile] = useState<string>("");
    const [generatingFix, setGeneratingFix] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [saveLabel, setSaveLabel] = useState("");

    // ── Track Monaco readiness ──────────────────────────────────────────────
    // This is the key fix: we only attempt to sync the editor once it's mounted.
    const [editorReady, setEditorReady] = useState(false);

    // ── Timeline state ──────────────────────────────────────────────────────
    const [timeline, setTimeline] = useState<FileTimeline>({ snapshots: [], currentIndex: -1 });

    const canUndo = timeline.currentIndex > 0;
    const canRedo = timeline.currentIndex < timeline.snapshots.length - 1;
    const currentSnapshot: TimelineSnapshot | undefined = timeline.snapshots[timeline.currentIndex];
    const fileContent = currentSnapshot?.content ?? "";
    const fixedCode = (currentSnapshot && currentSnapshot.source !== 'original') ? currentSnapshot.content : "";

    // ── Refs ────────────────────────────────────────────────────────────────
    const diffContainerRef = useRef<HTMLDivElement | null>(null);
    const diffEditorRef = useRef<monaco.editor.IStandaloneDiffEditor | null>(null);
    const originalModelRef = useRef<monaco.editor.ITextModel | null>(null);
    const modifiedModelRef = useRef<monaco.editor.ITextModel | null>(null);

    const getModifiedEditor = () => diffEditorRef.current?.getModifiedEditor() ?? null;

    const timelineBarRef = useRef<HTMLDivElement | null>(null);
    const suppressChangeRef = useRef(false);
    const saveManualSnapshotRef = useRef<() => void>(() => { });
    const snapshotsRef = useRef(timeline.snapshots);
    const saveLabelRef = useRef(saveLabel);
    snapshotsRef.current = timeline.snapshots;
    saveLabelRef.current = saveLabel;

    // ── Auto-load file when preselectedFile arrives from terminal ───────────
    useEffect(() => {
        console.log("preselected file is changing")
        if (preselectedFile && preselectedFile !== selectedFile) {
            console.log("new preselected file changes")
            setSelectedFile(preselectedFile);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [preselectedFile]);

    // ── Redux ───────────────────────────────────────────────────────────────
    const selectedActivityId = useSelector((state: RootState) => state.activities.selectedActivityId);
    const activities = useSelector((state: RootState) => state.activities.activities as ActivityModel[]);
    const currentActivity = activities.find((a) => a.id === selectedActivityId);
    const currentRequest: RequestModel | undefined = currentActivity?.request;
    const currentResponse: ResponseModel | null = (currentActivity?.response as ResponseModel | undefined) ?? null;
    const electronAvailable = typeof window !== 'undefined' && (window as any).api;

    // ── Language helper ─────────────────────────────────────────────────────
    const getLanguageFromPath = (filePath: string): string => {
        const ext = filePath.split('.').pop()?.toLowerCase();
        const langMap: Record<string, string> = {
            ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
            py: 'python', java: 'java', cpp: 'cpp', c: 'c', cs: 'csharp',
            go: 'go', rs: 'rust', php: 'php', rb: 'ruby', swift: 'swift',
            kt: 'kotlin', html: 'html', css: 'css', json: 'json',
            xml: 'xml', yaml: 'yaml', yml: 'yaml',
        };
        return langMap[ext || ''] || 'plaintext';
    };

    // ── Timeline mutations ──────────────────────────────────────────────────

    const pushSnapshot = useCallback((snap: Omit<TimelineSnapshot, 'id' | 'timestamp'>) => {
        setTimeline(prev => {
            const kept = prev.snapshots.slice(0, prev.currentIndex + 1);
            const next: TimelineSnapshot = { ...snap, id: makeId(), timestamp: Date.now() };
            return { snapshots: [...kept, next], currentIndex: kept.length };
        });
    }, []);

    const jumpToIndex = useCallback((idx: number) => {
        setTimeline(prev => {
            if (idx < 0 || idx >= prev.snapshots.length) return prev;
            return { ...prev, currentIndex: idx };
        });
    }, []);

    const undo = useCallback(() => jumpToIndex(timeline.currentIndex - 1), [timeline.currentIndex, jumpToIndex]);
    const redo = useCallback(() => jumpToIndex(timeline.currentIndex + 1), [timeline.currentIndex, jumpToIndex]);

    // ── Save manual snapshot from the modified (right) editor ──────────────

    const saveManualSnapshot = useCallback((filePath: string) => {
        const modEditor = getModifiedEditor();
        if (!filePath || !modEditor) return;
        const content = modEditor.getValue();
        const manualCount = snapshotsRef.current.filter(s => s.source === 'manual').length;
        pushSnapshot({
            label: saveLabelRef.current.trim() || `Edit ${manualCount + 1}`,
            source: 'manual',
            content,
            filePath,
        });
        setSaveLabel("");
        setIsDirty(false);
        setMessage("✏️ Manual edit saved as snapshot.");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pushSnapshot]);

    // ── Monaco: create the diff editor once ────────────────────────────────

    useEffect(() => {
        if (!diffContainerRef.current) return;

        originalModelRef.current = monaco.editor.createModel("", "plaintext");
        modifiedModelRef.current = monaco.editor.createModel("", "plaintext");

        diffEditorRef.current = monaco.editor.createDiffEditor(diffContainerRef.current, {
            theme: 'vs-dark',
            automaticLayout: true,
            fontSize: 12,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            renderSideBySide: true,
            readOnly: false,
        });

        diffEditorRef.current.setModel({
            original: originalModelRef.current,
            modified: modifiedModelRef.current,
        });

        // ── KEY FIX: signal that the editor is now ready ──────────────────
        // This flips editorReady → true, which re-triggers the sync useEffect
        // below so that any file already loaded into timeline gets painted
        // into the editor immediately, even if the file was set before Monaco
        // had finished mounting.
        setEditorReady(true);

        const sub = modifiedModelRef.current.onDidChangeContent(() => {
            if (!suppressChangeRef.current) setIsDirty(true);
        });

        const modEditor = diffEditorRef.current.getModifiedEditor();
        modEditor.addCommand(
            monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
            () => { saveManualSnapshotRef.current(); }
        );

        return () => {
            sub.dispose();
            const de = diffEditorRef.current;
            const om = originalModelRef.current;
            const mm = modifiedModelRef.current;
            diffEditorRef.current = null;
            originalModelRef.current = null;
            modifiedModelRef.current = null;
            setEditorReady(false);
            try { de?.dispose(); } catch { }
            try { om?.dispose(); } catch { }
            try { mm?.dispose(); } catch { }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Keep saveManualSnapshotRef always pointing at the latest selectedFile closure
    useEffect(() => {
        saveManualSnapshotRef.current = () => saveManualSnapshot(selectedFile);
    }, [saveManualSnapshot, selectedFile]);

    // ── Sync diff editor when snapshot, file, or editor readiness changes ───
    // editorReady is included in deps so this re-runs the moment Monaco mounts,
    // catching the race where timeline was populated before the editor existed.

    useEffect(() => {
        console.log("Sync diff editor when snapshot, file, or editor readiness changes")
        if (!editorReady) return;  // wait until Monaco is mounted

        const om = originalModelRef.current;
        const mm = modifiedModelRef.current;
        const de = diffEditorRef.current;
        if (!om || !mm || !de) return;

        suppressChangeRef.current = true;
        try {
            if (!selectedFile) {
                om.setValue("");
                mm.setValue("");
                return;
            }

            const lang = getLanguageFromPath(selectedFile);

            const originalSnap = timeline.snapshots.find(
                s => s.source === 'original' && s.filePath === selectedFile
            );
            om.setValue(originalSnap?.content ?? "");
            monaco.editor.setModelLanguage(om, lang);

            const modEditor = de.getModifiedEditor();
            const prevPos = modEditor.getPosition();
            mm.setValue(fileContent);
            monaco.editor.setModelLanguage(mm, lang);
            if (prevPos) modEditor.setPosition(prevPos);
        } catch (e) {
            console.log("inside catch of sync useeffect")
            console.log(String(e));
        } finally {
            suppressChangeRef.current = false;
        }

        setIsDirty(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeline.currentIndex, timeline.snapshots.length, selectedFile, editorReady]);

    // ── Load file when selected ─────────────────────────────────────────────

    useEffect(() => {
        console.log("before file changing")
        const loadFileContent = async () => {
            if (!selectedFile || !electronAvailable) {
                setTimeline({ snapshots: [], currentIndex: -1 });
                return;
            }
            try {
                console.log("before file injection in useeeffect")
                console.log("selectedFile", selectedFile)
                const res = await injectService.readFile(selectedFile);
                if (res.ok && res.content !== undefined) {
                    const snap: TimelineSnapshot = {
                        id: makeId(), label: 'Original', source: 'original',
                        content: res.content, timestamp: Date.now(), filePath: selectedFile,
                    };
                    setTimeline({ snapshots: [snap], currentIndex: 0 });
                    setIsDirty(false);
                    setMessage(null);
                } else {
                    setMessage(res.message || "Failed to read file");
                    setTimeline({ snapshots: [], currentIndex: -1 });
                }
            } catch (error) {
                console.error('Failed to load file content', error);
                setMessage("Unexpected error while reading file.");
                setTimeline({ snapshots: [], currentIndex: -1 });
            }
        };
        loadFileContent();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedFile, electronAvailable]);

    // ── Auto-scroll timeline bar ────────────────────────────────────────────

    useEffect(() => {
        if (!timelineBarRef.current) return;
        const active = timelineBarRef.current.querySelector<HTMLElement>('[data-active="true"]');
        active?.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
    }, [timeline.currentIndex]);

    // Persist editor file context for AI request-editing.
    useEffect(() => {
        if (!activityId) return;
        const key = `callsensei.aiContext.${activityId}`;
        try {
            const existingRaw = localStorage.getItem(key);
            const existing = existingRaw ? JSON.parse(existingRaw) : {};
            localStorage.setItem(
                key,
                JSON.stringify({
                    ...existing,
                    editorFilePath: selectedFile || "",
                    editorFileContent: fileContent.slice(-20000),
                    updatedAt: Date.now(),
                }),
            );
        } catch {
            // Best-effort only.
        }
    }, [activityId, selectedFile, fileContent]);

    // ── Global Ctrl+Z / Y for timeline nav (skips when focus is in Monaco) ──

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('.monaco-editor')) return;
            const ctrl = e.ctrlKey || e.metaKey;
            if (!ctrl) return;
            if (e.key === 'z' && !e.shiftKey && canUndo) { e.preventDefault(); undo(); }
            if ((e.key === 'y' || (e.key === 'z' && e.shiftKey)) && canRedo) { e.preventDefault(); redo(); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [canUndo, canRedo, undo, redo]);

    // ── Handlers ────────────────────────────────────────────────────────────

    const handlePreview = async () => {
        setMessage(null); setPreviewing(true);
        try {
            const res = await injectService.previewPatch(patchText);
            if (res.ok) setFiles(res.files || []);
            else setMessage(res.message || "Failed to preview patch");
        } catch (error) {
            console.error('handlePreview failed', error);
            setMessage("Unexpected error while previewing patch.");
        } finally { setPreviewing(false); }
    };

    const handleAccept = async () => {
        setMessage(null); setApplying(true);
        try {
            const modEditor = getModifiedEditor();
            const contentToWrite = modEditor?.getValue() ?? fileContent;
            if (selectedFile && contentToWrite) {
                const writeRes = await injectService.writeFile(selectedFile, contentToWrite);
                if (writeRes.ok) {
                    pushSnapshot({
                        label: `Applied (${new Date().toLocaleTimeString()})`,
                        source: 'applied', content: contentToWrite, filePath: selectedFile,
                    });
                    setIsDirty(false);
                    setMessage(`Applied to: ${selectedFile}`);
                } else {
                    setMessage(writeRes.message || 'Failed to write file');
                }
            } else {
                const res = await injectService.applyPatch(patchText);
                if (res.ok) {
                    setMessage(`Applied successfully${res.written?.length ? `: ${res.written.length} file(s)` : ''}`);
                    setFiles([]); setPatchText("");
                } else {
                    setMessage(res.message || "Failed to apply patch");
                }
            }
        } catch (error) {
            console.error('handleAccept failed', error);
            setMessage("Unexpected error while applying.");
        } finally { setApplying(false); }
    };

    const handleReject = () => { setFiles([]); setMessage("Discarded patch"); };

    const handleGenerateFix = async () => {
        if (!selectedFile || !currentRequest) {
            setMessage("Please select a file and ensure a request is available.");
            return;
        }
        setMessage(null); setGeneratingFix(true);
        try {
            const requestSummary: AiRequestSummary = {
                method: currentRequest.method, url: currentRequest.url,
                headers: currentRequest.headers || {}, body: currentRequest.body || "",
            };
            const responseSummary: AiResponseSummary | undefined = currentResponse ? {
                status: currentResponse.status, statusText: currentResponse.statusText,
                headers: currentResponse.headers || {}, body: currentResponse.body || "",
            } : undefined;
            const fixed = await generateAiCodeFix({
                request: requestSummary, response: responseSummary,
                filePath: selectedFile, fileContent,
                activityName: currentActivity?.name, activityId: currentActivity?.id,
            });
            pushSnapshot({
                label: `AI Fix ${timeline.snapshots.filter(s => s.source === 'ai-fix').length + 1}`,
                source: 'ai-fix', content: fixed, filePath: selectedFile,
            });
            setMessage("AI fix generated successfully!");
        } catch (error) {
            console.error('Failed to generate AI fix', error);
            setMessage("Failed to generate AI fix.");
        } finally { setGeneratingFix(false); }
    };

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="bg-[#2a2a3a] rounded-lg p-4 space-y-3">
            <h3 className="text-lg font-semibold text-white">Patch Review</h3>

            {!electronAvailable && (
                <div className="text-xs text-yellow-300 bg-yellow-900/40 border border-yellow-800 rounded p-2">
                    File chooser and write require the Electron desktop app. Start with "npm run dev:app".
                </div>
            )}

        
            {!currentRequest && (
                <div className="text-xs text-amber-300 bg-amber-900/40 border border-amber-800 rounded p-2">
                    No request selected. Select or create a request to generate AI fixes.
                </div>
            )}

            {/* ── File chooser buttons ── */}
            <div className="flex flex-wrap items-center gap-2">
                <button
                    onClick={async () => {
                        try {
                            const res = await injectService.selectDirectory();
                            if (res.ok && res.path) setSelectedDir(res.path);
                            else if (!res.ok && res.message) setMessage(res.message);
                        } catch { setMessage("Unexpected error while selecting directory."); }
                    }}
                    disabled={!electronAvailable}
                    className={`px-3 py-1.5 rounded ${electronAvailable ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-gray-600'} text-white text-sm`}
                >Choose Folder</button>

                <button
                    onClick={async () => {
                        try {
                            const res = await injectService.selectFile(selectedDir || undefined);
                            if (res.ok && res.path) setSelectedFile(res.path);
                            else if (!res.ok && res.message) setMessage(res.message);
                        } catch { setMessage("Unexpected error while selecting file."); }
                    }}
                    disabled={!electronAvailable}
                    className={`px-3 py-1.5 rounded ${electronAvailable ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-gray-600'} text-white text-sm`}
                >Choose File</button>

                <button
                    onClick={handleGenerateFix}
                    disabled={!selectedFile || !currentRequest || !fileContent || generatingFix || !electronAvailable}
                    className={`px-3 py-1.5 rounded ${(!selectedFile || !currentRequest || !fileContent || generatingFix || !electronAvailable) ? 'bg-gray-600' : 'bg-purple-600 hover:bg-purple-500'} text-white text-sm`}
                >
                    {generatingFix ? 'Generating Fix...' : '🤖 Generate AI Fix'}
                </button>

                {selectedDir && <span className="text-xs text-gray-300 truncate max-w-xs">📁 {selectedDir}</span>}
                {selectedFile && <span className="text-xs text-gray-300 truncate max-w-xs">📄 {selectedFile}</span>}
            </div>

            {/* ── Timeline bar ── */}
            {timeline.snapshots.length > 0 && (
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            File Timeline
                            <span className="ml-2 text-gray-500 font-normal normal-case">
                                ({timeline.currentIndex + 1} / {timeline.snapshots.length})
                            </span>
                        </span>
                        <div className="flex items-center gap-1">
                            <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)"
                                className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors
                                    ${canUndo ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-slate-800 text-gray-600 cursor-not-allowed'}`}>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                                Undo
                            </button>
                            <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)"
                                className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors
                                    ${canRedo ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-slate-800 text-gray-600 cursor-not-allowed'}`}>
                                Redo
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Snapshot strip */}
                    <div ref={timelineBarRef} className="flex items-center overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
                        {timeline.snapshots.map((snap, idx) => {
                            const isActive = idx === timeline.currentIndex;
                            const isPast = idx < timeline.currentIndex;
                            const isFuture = idx > timeline.currentIndex;
                            const meta = SOURCE_META[snap.source];
                            return (
                                <React.Fragment key={snap.id}>
                                    {idx > 0 && (
                                        <div className={`flex-shrink-0 h-0.5 w-4 ${isPast || isActive ? 'bg-slate-500' : 'bg-slate-700'}`} />
                                    )}
                                    <button
                                        data-active={isActive}
                                        onClick={() => jumpToIndex(idx)}
                                        title={`${snap.label}\n${new Date(snap.timestamp).toLocaleTimeString()}`}
                                        className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-2 py-1.5 rounded transition-all duration-150 border
                                            ${isActive
                                                ? `${meta.color} border-white/50 shadow-lg scale-105`
                                                : isPast
                                                    ? 'bg-slate-700/60 border-slate-600 hover:bg-slate-600/60'
                                                    : 'bg-slate-800/40 border-slate-700/50 opacity-50 hover:opacity-75'}`}
                                    >
                                        <span className="text-xs leading-none">{meta.icon}</span>
                                        <span className={`text-[10px] leading-none whitespace-nowrap ${isActive ? 'text-white font-semibold' : isFuture ? 'text-gray-500' : 'text-gray-300'}`}>
                                            {snap.label}
                                        </span>
                                        <span className="text-[9px] leading-none text-gray-500">
                                            {new Date(snap.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </span>
                                    </button>
                                </React.Fragment>
                            );
                        })}
                    </div>

                    {/* Info strip */}
                    {currentSnapshot && (
                        <div className="flex items-center gap-2 text-[11px] text-gray-400 bg-slate-800/50 rounded px-2 py-1">
                            <span>{SOURCE_META[currentSnapshot.source].icon}</span>
                            <span className="font-medium text-gray-300">{currentSnapshot.label}</span>
                            <span>·</span>
                            <span>{currentSnapshot.content.split('\n').length} lines</span>
                            <span>·</span>
                            <span>{new Date(currentSnapshot.timestamp).toLocaleTimeString()}</span>
                        </div>
                    )}
                </div>
            )}

            {/* ── Diff editor with editable right pane ── */}
            <div className="rounded border border-gray-700 overflow-hidden">
                {/* Header */}
                <div className="flex text-xs font-medium bg-[#1e1e2e] border-b border-gray-700">
                    {/* Left label */}
                    <div className="flex-1 px-3 py-2 text-gray-400 flex items-center gap-1.5">
                        <span className="text-red-400">▬</span>
                        <span>Original</span>
                        <span className="ml-auto text-gray-600 italic text-[10px]">read-only</span>
                    </div>
                    {/* Right label + save controls */}
                    <div className="flex-1 px-3 py-2 flex items-center gap-1.5 border-l border-gray-700 min-w-0">
                        <span className="text-green-400">▬</span>
                        <span className="text-blue-200">Working Copy</span>
                        {isDirty && (
                            <span className="ml-1 px-1.5 py-0.5 rounded bg-amber-700/60 text-amber-300 text-[10px] flex-shrink-0">
                                unsaved
                            </span>
                        )}
                        <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
                            {isDirty ? (
                                <>
                                    <input
                                        type="text"
                                        placeholder="Label (optional)"
                                        value={saveLabel}
                                        onChange={e => setSaveLabel(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') saveManualSnapshotRef.current(); }}
                                        className="px-2 py-0.5 rounded bg-slate-800 border border-slate-600 text-[11px] text-gray-200 outline-none focus:border-blue-500 w-28"
                                    />
                                    <button
                                        onClick={() => saveManualSnapshotRef.current()}
                                        title="Save snapshot (Ctrl+S)"
                                        className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold whitespace-nowrap"
                                    >
                                        💾 Save
                                    </button>
                                </>
                            ) : (
                                <span className="text-gray-600 italic text-[10px]">
                                    {currentSnapshot && currentSnapshot.source !== 'original'
                                        ? `${SOURCE_META[currentSnapshot.source].icon} ${currentSnapshot.label}`
                                        : 'edit right pane to create snapshot'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* The diff editor container */}
                <div ref={diffContainerRef} style={{ height: 420 }} />
            </div>



            {/* ── Action buttons ── */}
            <div className="flex items-center gap-2">
                <button
                    disabled={!patchText.trim() || previewing}
                    onClick={handlePreview}
                    className={`px-3 py-1.5 rounded ${previewing ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-500'} text-white text-sm`}
                >
                    {previewing ? 'Previewing…' : 'Preview'}
                </button>
                <button
                    disabled={applying || !(isDirty || fixedCode || patchText.trim())}
                    onClick={handleAccept}
                    className={`px-3 py-1.5 rounded ${(applying || !(isDirty || fixedCode || patchText.trim())) ? 'bg-gray-600' : 'bg-green-600 hover:bg-green-500'} text-white text-sm`}
                >
                    {applying ? 'Applying…' : isDirty ? 'Apply Edits ✅' : fixedCode ? 'Apply AI Fix ✅' : 'Apply Change ✅'}
                </button>
                <button
                    disabled={!files.length}
                    onClick={handleReject}
                    className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white text-sm"
                >
                    Reject ❌
                </button>
            </div>

            {message && <div className="text-xs text-gray-300">{message}</div>}

            {/* ── Affected files list ── */}
            {!!files.length && (
                <div className="mt-2">
                    <div className="text-white font-medium text-sm mb-1">Files affected</div>
                    <ul className="space-y-1">
                        {files.map((f, idx) => (
                            <li key={idx} className="text-xs text-gray-300 flex items-center gap-2">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase ${f.status === 'add' ? 'bg-green-700' : f.status === 'delete' ? 'bg-red-700' : 'bg-blue-700'}`}>
                                    {f.status}
                                </span>
                                <span className="truncate">{f.path}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default function PatchReviewWithBoundary({ preselectedFile, activityId }: { preselectedFile?: string; activityId?: string }) {
    return (
        <EditorErrorBoundary>
            <PatchReview preselectedFile={preselectedFile} activityId={activityId} />
        </EditorErrorBoundary>
    );
}