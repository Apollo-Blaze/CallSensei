import React, { useEffect, useMemo, useState } from "react";
import {
  generateCode,
  CODE_LANGUAGE_OPTIONS,
  getDownloadFilename,
  type CodeLanguage,
} from "../../utils/codeGenerator";
import type { RequestFormData } from "../../models/RequestModel";

interface GenerateCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestData: RequestFormData;
}

const GenerateCodeModal: React.FC<GenerateCodeModalProps> = ({
  isOpen,
  onClose,
  requestData,
}) => {
  const [language, setLanguage] = useState<CodeLanguage>("curl");
  const [copied, setCopied] = useState(false);

  const code = useMemo(
    () => (isOpen ? generateCode(requestData, language) : ""),
    [isOpen, requestData, language]
  );

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const filename = getDownloadFilename(language, "request");
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-label="Generate code"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-[min(720px,95vw)] max-h-[85vh] flex flex-col rounded-lg border border-white/10 bg-[#18182a] shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Generated code</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white transition p-1 rounded"
            aria-label="Close"
            title="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 flex-wrap">
          <label className="text-sm text-white/80">Language:</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as CodeLanguage)}
            className="bg-[#101022] text-white rounded px-3 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/60 text-sm min-w-[180px]"
          >
            {CODE_LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-2 rounded border border-white/20 text-white/90 hover:bg-white/10 text-sm transition"
            >
              {copied ? "Copied!" : "Copy code"}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm transition"
            >
              Download code
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden p-4">
          <pre
            className="h-full w-full overflow-auto rounded bg-[#101022] border border-white/10 p-4 text-sm text-white/90 font-mono whitespace-pre-wrap break-words custom-scrollbar"
            style={{ minHeight: "280px" }}
          >
            <code>{code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default GenerateCodeModal;