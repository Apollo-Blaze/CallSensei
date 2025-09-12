import React, { useState } from "react";
import injectService from "../../../services/injectService";

const PatchReview: React.FC = () => {
    const [patchText, setPatchText] = useState("");
    const [previewing, setPreviewing] = useState(false);
    const [applying, setApplying] = useState(false);
    const [files, setFiles] = useState<Array<{ path: string; status: 'modify' | 'add' | 'delete' }>>([]);
    const [message, setMessage] = useState<string | null>(null);
    const [selectedDir, setSelectedDir] = useState<string>("");
    const [selectedFile, setSelectedFile] = useState<string>("");
    const [hardcodedContent, setHardcodedContent] = useState<string>("// Example hardcoded code\nexport const hello = () => console.log('Hello from injected code');\n");

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
        } finally {
            setPreviewing(false);
        }
    };

    const handleAccept = async () => {
        setMessage(null);
        setApplying(true);
        try {
            // If a specific file is chosen, write content directly; otherwise, apply patch flow
            if (selectedFile) {
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
        } finally {
            setApplying(false);
        }
    };

    const handleReject = () => {
        setFiles([]);
        setMessage("Discarded patch");
    };

    const electronAvailable = typeof window !== 'undefined' && (window as any).api;

    return (
        <div className="bg-[#2a2a3a] rounded-lg p-4 space-y-3">
            <h3 className="text-lg font-semibold text-white">Patch Review</h3>
            {!electronAvailable && (
                <div className="text-xs text-yellow-300 bg-yellow-900/40 border border-yellow-800 rounded p-2">
                    File chooser and write require the Electron desktop app. Start with "npm run dev:app".
                </div>
            )}
            <p className="text-gray-300 text-sm">You can write a hardcoded change to a chosen folder/file, or paste a diff below.</p>
            <div className="flex flex-wrap items-center gap-2">
                <button
                    onClick={async () => {
                        const res = await injectService.selectDirectory();
                        if (res.ok && res.path) setSelectedDir(res.path);
                    }}
                    disabled={!electronAvailable}
                    className={`px-3 py-1.5 rounded ${electronAvailable ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-gray-600'} text-white text-sm`}
                >Choose Folder</button>
                <button
                    onClick={async () => {
                        const res = await injectService.selectFile(selectedDir || undefined);
                        if (res.ok && res.path) setSelectedFile(res.path);
                    }}
                    disabled={!electronAvailable}
                    className={`px-3 py-1.5 rounded ${electronAvailable ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-gray-600'} text-white text-sm`}
                >Choose File</button>
                {selectedDir && <span className="text-xs text-gray-300">Folder: {selectedDir}</span>}
                {selectedFile && <span className="text-xs text-gray-300">File: {selectedFile}</span>}
            </div>
            <div className="space-y-2">
                <div className="text-white font-medium text-sm">Hardcoded Code</div>
                <textarea
                    className="w-full h-28 bg-[#1f1f2e] text-gray-200 p-2 rounded resize-y outline-none"
                    value={hardcodedContent}
                    onChange={(e) => setHardcodedContent(e.target.value)}
                />
            </div>
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
                    disabled={applying}
                    onClick={handleAccept}
                    className={`px-3 py-1.5 rounded ${applying ? 'bg-gray-600' : 'bg-green-600 hover:bg-green-500'} text-white text-sm`}
                >
                    {applying ? 'Applying…' : 'Apply Change ✅'}
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


