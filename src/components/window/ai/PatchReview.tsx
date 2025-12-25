import React, { useState ,useEffect ,useRef } from "react";
import { useSelector } from "react-redux";
import injectService from "../../../services/injectService";
import { generateAiCodeFix, type AiRequestSummary, type AiResponseSummary } from "../../../services/aiService";
import type { RootState } from "../../../state/store";
import type { ActivityModel } from "../../../models/ActivityModel";
import type { RequestModel, ResponseModel } from "../../../models";
import * as monaco from 'monaco-editor';

const PatchReview: React.FC = () => {
    const [patchText, setPatchText] = useState("");
    const [previewing, setPreviewing] = useState(false);
    const [applying, setApplying] = useState(false);
    const [files, setFiles] = useState<Array<{ path: string; status: 'modify' | 'add' | 'delete' }>>([]);
    const [message, setMessage] = useState<string | null>(null);
    const [selectedDir, setSelectedDir] = useState<string>("");
    const [selectedFile, setSelectedFile] = useState<string>("");
    const [fileContent, setFileContent] = useState<string>("");
    const [fixedCode, setFixedCode] = useState<string>("");
    const [generatingFix, setGeneratingFix] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [hardcodedContent, _setHardcodedContent] = useState<string>("// Example hardcoded code\nexport const hello = () => console.log('Hello from injected code');\n");
    const containerRef = useRef<HTMLDivElement | null>(null);
    const diffEditorRef = useRef<monaco.editor.IStandaloneDiffEditor | null>(null);
    const originalModelRef = useRef<monaco.editor.ITextModel | null>(null);
    const modifiedModelRef = useRef<monaco.editor.ITextModel | null>(null);

    // Get current activity from Redux
    const selectedActivityId = useSelector((state: RootState) => state.activities.selectedActivityId);
    const activities = useSelector((state: RootState) => state.activities.activities as ActivityModel[]);
    const currentActivity = activities.find((a) => a.id === selectedActivityId);
    const currentRequest: RequestModel | undefined = currentActivity?.request;
    const currentResponse: ResponseModel | null = (currentActivity?.response as ResponseModel | undefined) ?? null;
    const electronAvailable = typeof window !== 'undefined' && (window as any).api;

    // Helper function to get language from file extension
    const getLanguageFromPath = (filePath: string): string => {
        const ext = filePath.split('.').pop()?.toLowerCase();
        const langMap: Record<string, string> = {
            'ts': 'typescript',
            'tsx': 'typescript',
            'js': 'javascript',
            'jsx': 'javascript',
            'py': 'python',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'c',
            'cs': 'csharp',
            'go': 'go',
            'rs': 'rust',
            'php': 'php',
            'rb': 'ruby',
            'swift': 'swift',
            'kt': 'kotlin',
            'html': 'html',
            'css': 'css',
            'json': 'json',
            'xml': 'xml',
            'yaml': 'yaml',
            'yml': 'yaml',
        };
        return langMap[ext || ''] || 'plaintext';
    };

  // Initialize Monaco diff editor
  useEffect(() => {
    if (!containerRef.current) return;

    // CREATE editor only AFTER DOM exists
    diffEditorRef.current = monaco.editor.createDiffEditor(
      containerRef.current,
      {
        theme: "vs-dark",
        automaticLayout: true,
        renderSideBySide: true,
      }
    );

    originalModelRef.current = monaco.editor.createModel(
      "",
      "plaintext"
    );

    modifiedModelRef.current = monaco.editor.createModel(
      "",
      "plaintext"
    );

    diffEditorRef.current.setModel({
      original: originalModelRef.current,
      modified: modifiedModelRef.current,
    });

    // Cleanup (VERY important in React)
    return () => {
      // Store refs locally to avoid race conditions
      const editor = diffEditorRef.current;
      const originalModel = originalModelRef.current;
      const modifiedModel = modifiedModelRef.current;
      
      // Clear refs first to prevent further access
      diffEditorRef.current = null;
      originalModelRef.current = null;
      modifiedModelRef.current = null;
      
      // Dispose diff editor first (this releases its reference to models)
      if (editor) {
        try {
          editor.dispose();
        } catch (e) {
          // Editor might already be disposed, ignore
        }
      }
      
      // Then dispose models separately
      if (originalModel) {
        try {
          originalModel.dispose();
        } catch (e) {
          // Model might already be disposed, ignore
        }
      }
      
      if (modifiedModel) {
        try {
          modifiedModel.dispose();
        } catch (e) {
          // Model might already be disposed, ignore
        }
      }
    };
  }, []);

  // Load file content when selectedFile changes
  useEffect(() => {
    const loadFileContent = async () => {
      if (!selectedFile || !electronAvailable) {
        setFileContent("");
        return;
      }

      try {
        const res = await injectService.readFile(selectedFile);
        if (res.ok && res.content !== undefined) {
          setFileContent(res.content);
          // Update original model with file content
          if (originalModelRef.current) {
            const language = getLanguageFromPath(selectedFile);
            originalModelRef.current.setValue(res.content);
            monaco.editor.setModelLanguage(originalModelRef.current, language);
          }
          // Clear fixed code when loading new file
          setFixedCode("");
          if (modifiedModelRef.current) {
            modifiedModelRef.current.setValue("");
          }
        } else {
          setMessage(res.message || "Failed to read file");
          setFileContent("");
        }
      } catch (error) {
        console.error('Failed to load file content', error);
        setMessage("Unexpected error while reading file. See console for details.");
        setFileContent("");
      }
    };

    loadFileContent();
  }, [selectedFile, electronAvailable]);

  // Update diff editor when fileContent or fixedCode changes
  useEffect(() => {
    if (!diffEditorRef.current || !originalModelRef.current || !modifiedModelRef.current) return;

    if (selectedFile) {
      const language = getLanguageFromPath(selectedFile);
      
      // Update original model
      originalModelRef.current.setValue(fileContent || "");
      monaco.editor.setModelLanguage(originalModelRef.current, language);
      
      // Update modified model with fixed code if available
      if (fixedCode) {
        modifiedModelRef.current.setValue(fixedCode);
        monaco.editor.setModelLanguage(modifiedModelRef.current, language);
      } else {
        modifiedModelRef.current.setValue("");
      }
      
      diffEditorRef.current.setModel({
        original: originalModelRef.current,
        modified: modifiedModelRef.current,
      });
    }
  }, [fileContent, fixedCode, selectedFile]);
    const handlePreview = async () => {
        setMessage(null);
        setPreviewing(true);
        try {
            const res = await injectService.previewPatch(patchText);
            if (res.ok) {
                setFiles(res.files || []);
            } else {
                setMessage(res.message || "Failed to preview patch");
            }
        } catch (error) {
            console.error('handlePreview failed', error);
            setMessage("Unexpected error while previewing patch. See console for details.");
        } finally {
            setPreviewing(false);
        }
    };

    const handleAccept = async () => {
        setMessage(null);
        setApplying(true);
        try {
            // If we have fixed code from AI, write that; otherwise use the existing logic
            if (selectedFile && fixedCode) {
                const writeRes = await injectService.writeFile(selectedFile, fixedCode);
                if (writeRes.ok) {
                    setMessage(`Applied AI fix to: ${selectedFile}`);
                    setFileContent(fixedCode); // Update local content
                    setFixedCode(""); // Clear fixed code after applying
                } else {
                    setMessage(writeRes.message || 'Failed to write file');
                }
            } else if (selectedFile) {
                const writeRes = await injectService.writeFile(selectedFile, hardcodedContent);
                setMessage(writeRes.ok ? `Wrote file: ${selectedFile}` : writeRes.message || 'Failed to write file');
            } else if (selectedDir) {
                const target = `${selectedDir.replace(/\\+$/, '')}/injected.ts`;
                const writeRes = await injectService.writeFile(target, hardcodedContent);
                setMessage(writeRes.ok ? `Wrote file: ${target}` : writeRes.message || 'Failed to write file');
            } else {
                const res = await injectService.applyPatch(patchText);
                if (res.ok) {
                    setMessage(`Applied successfully${res.written && res.written.length ? `: ${res.written.length} file(s)` : ''}`);
                    setFiles([]);
                    setPatchText("");
                } else {
                    setMessage(res.message || "Failed to apply patch");
                }
            }
        } catch (error) {
            console.error('handleAccept failed', error);
            setMessage("Unexpected error while applying patch. See console for details.");
        } finally {
            setApplying(false);
        }
    };

    const handleReject = () => {
        setFiles([]);
        setMessage("Discarded patch");
    };

    return (
        <div className="bg-[#2a2a3a] rounded-lg p-4 space-y-3">
            <h3 className="text-lg font-semibold text-white">Patch Review</h3>
            {!electronAvailable && (
                <div className="text-xs text-yellow-300 bg-yellow-900/40 border border-yellow-800 rounded p-2">
                    File chooser and write require the Electron desktop app. Start with "npm run dev:app".
                </div>
            )}
            <p className="text-gray-300 text-sm">Select a file to view its content and generate AI-powered fixes based on the current request/response.</p>
            {!currentRequest && (
                <div className="text-xs text-amber-300 bg-amber-900/40 border border-amber-800 rounded p-2">
                    No request selected. Select or create a request to generate AI fixes.
                </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
                <button
                    onClick={async () => {
                        try {
                            const res = await injectService.selectDirectory();
                            if (res.ok && res.path) setSelectedDir(res.path);
                            else if (!res.ok && res.message) setMessage(res.message);
                        } catch (error) {
                            console.error('selectDirectory handler failed', error);
                            setMessage("Unexpected error while selecting directory. See console for details.");
                        }
                    }}
                    disabled={!electronAvailable}
                    className={`px-3 py-1.5 rounded ${electronAvailable ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-gray-600'} text-white text-sm`}
                >Choose Folder</button>
                <button
                    onClick={async () => {
                        try {
                            const res = await injectService.selectFile(selectedDir || undefined);
                            if (res.ok && res.path) {
                                setSelectedFile(res.path);
                                setFixedCode(""); // Clear previous fixed code
                            } else if (!res.ok && res.message) setMessage(res.message);
                        } catch (error) {
                            console.error('selectFile handler failed', error);
                            setMessage("Unexpected error while selecting file. See console for details.");
                        }
                    }}
                    disabled={!electronAvailable}
                    className={`px-3 py-1.5 rounded ${electronAvailable ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-gray-600'} text-white text-sm`}
                >Choose File</button>
                <button
                    onClick={async () => {
                        if (!selectedFile || !currentRequest) {
                            setMessage("Please select a file and ensure a request is available.");
                            return;
                        }

                        setMessage(null);
                        setGeneratingFix(true);
                        
                        try {
                            const requestSummary: AiRequestSummary = {
                                method: currentRequest.method,
                                url: currentRequest.url,
                                headers: currentRequest.headers || {},
                                body: currentRequest.body || "",
                            };

                            const responseSummary: AiResponseSummary | undefined = currentResponse ? {
                                status: currentResponse.status,
                                statusText: currentResponse.statusText,
                                headers: currentResponse.headers || {},
                                body: currentResponse.body || "",
                            } : undefined;

                            const fixed = await generateAiCodeFix({
                                request: requestSummary,
                                response: responseSummary,
                                filePath: selectedFile,
                                fileContent: fileContent,
                                activityName: currentActivity?.name,
                                activityId: currentActivity?.id,
                            });

                            setFixedCode(fixed);
                            setMessage("AI fix generated successfully!");
                        } catch (error) {
                            console.error('Failed to generate AI fix', error);
                            setMessage("Failed to generate AI fix. See console for details.");
                        } finally {
                            setGeneratingFix(false);
                        }
                    }}
                    disabled={!selectedFile || !currentRequest || !fileContent || generatingFix || !electronAvailable}
                    className={`px-3 py-1.5 rounded ${(!selectedFile || !currentRequest || !fileContent || generatingFix || !electronAvailable) ? 'bg-gray-600' : 'bg-purple-600 hover:bg-purple-500'} text-white text-sm`}
                >
                    {generatingFix ? 'Generating Fix...' : '🤖 Generate AI Fix'}
                </button>
                {selectedDir && <span className="text-xs text-gray-300">Folder: {selectedDir}</span>}
                {selectedFile && <span className="text-xs text-gray-300">File: {selectedFile}</span>}
            </div>
            {/* <div className="space-y-2">
                <div className="text-white font-medium text-sm">Hardcoded Code</div>
                <textarea
                    className="w-full h-28 bg-[#1f1f2e] text-gray-200 p-2 rounded resize-y outline-none"
                    value={hardcodedContent}
                    onChange={(e) => setHardcodedContent(e.target.value)}
                />
            </div> */}
            
            <div
      ref={containerRef}
       className="w-full h-[400px] rounded border border-gray-700"
    />
            <textarea
                className="w-full h-40 bg-[#1f1f2e] text-gray-200 p-2 rounded resize-y outline-none"
                placeholder={`Example:\n--- a/src/foo.ts\n+++ b/src/foo.ts\n@@ -1,2 +1,2 @@\n- old\n+ new`}
                value={patchText}
                onChange={(e) => setPatchText(e.target.value)}
            />
            <div className="flex items-center gap-2">
                <button
                    disabled={!patchText.trim() || previewing}
                    onClick={handlePreview}
                    className={`px-3 py-1.5 rounded ${previewing ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-500'} text-white text-sm`}
                >
                    {previewing ? 'Previewing…' : 'Preview'}
                </button>
                <button
                    disabled={applying || !(fixedCode || patchText.trim())}
                    onClick={handleAccept}
                    className={`px-3 py-1.5 rounded ${(applying || !(fixedCode || patchText.trim())) ? 'bg-gray-600' : 'bg-green-600 hover:bg-green-500'} text-white text-sm`}
                >
                    {applying ? 'Applying…' : fixedCode ? 'Apply AI Fix ✅' : 'Apply Change ✅'}
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
            {!!files.length && (
                <div className="mt-2">
                    <div className="text-white font-medium text-sm mb-1">Files affected</div>
                    <ul className="space-y-1">
                        {files.map((f, idx) => (
                            <li key={idx} className="text-xs text-gray-300 flex items-center gap-2">
                                <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] uppercase ${f.status === 'add' ? 'bg-green-700' : f.status === 'delete' ? 'bg-red-700' : 'bg-blue-700'
                                        }`}
                                >{f.status}</span>
                                <span className="truncate">{f.path}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default PatchReview;


