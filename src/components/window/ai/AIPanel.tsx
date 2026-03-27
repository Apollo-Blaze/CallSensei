import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiX } from "react-icons/fi";
import { FaRobot } from "react-icons/fa";
import { createPortal } from "react-dom";
import type { RootState } from "../../../state/store";
import type { RequestModel, ResponseModel } from "../../../models";
import type { ActivityModel } from "../../../models/ActivityModel";
import { generateAiExplanation, generateAiUiEdit } from "../../../services/aiService";
import { updateActivity } from "../../../state/activitiesSlice";
import { buildActivityUpdateFromAiJson } from "../../../utils/activityUpdateTool";

interface AIPanelProps {
  isOpen: boolean;
  onClose: () => void;
  explanation: string;
  onSetExplanation: (text: string) => void;
  selectedId: string | null;
  isFloating: boolean;
  onFloatingChange: (floating: boolean) => void;
}

type ChatMessage = {
  id: string;
  from: "user" | "ai";
  text: string;
};

const MIN_WIDTH = 280;
const MAX_WIDTH = 600;
const DEFAULT_DOCKED_WIDTH = 352;
const DEFAULT_FLOAT_WIDTH = 360;
const DEFAULT_FLOAT_HEIGHT = 560;
const MIN_HEIGHT = 300;

const AIPanel: React.FC<AIPanelProps> = ({
  isOpen,
  onClose,
  explanation,
  onSetExplanation,
  selectedId,
  isFloating,
  onFloatingChange,
}) => {
  const dispatch = useDispatch();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [dockedWidth, setDockedWidth] = useState(DEFAULT_DOCKED_WIDTH);
  const [floatPos, setFloatPos] = useState({
    x: window.innerWidth - DEFAULT_FLOAT_WIDTH - 24,
    y: 80,
  });
  const [floatSize, setFloatSize] = useState({
    w: DEFAULT_FLOAT_WIDTH,
    h: DEFAULT_FLOAT_HEIGHT,
  });

  const isDraggingPanel = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const isResizing = useRef<string | null>(null);
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0, panelX: 0, panelY: 0 });

  // Ref to the chat CONTAINER div — we scroll this, not the document
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Scroll only the chat container to the bottom on new messages
  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const activities = useSelector(
    (state: RootState) => state.activities.activities as ActivityModel[]
  );

  const currentActivity = activities.find((a) => a.id === selectedId);
  const currentRequest: RequestModel | undefined = currentActivity?.request;
  const currentResponse: ResponseModel | null =
    (currentActivity?.response as ResponseModel | undefined) ?? null;
  const activityName = currentActivity?.name;
  const activityId = currentActivity?.id;

  const buildRequestSummary = () =>
    currentRequest && {
      method: currentRequest.method,
      url: currentRequest.url,
      headers: currentRequest.headers || {},
      body: currentRequest.body || "",
    };

  const buildResponseSummary = () =>
    currentResponse && {
      status: currentResponse.status,
      statusText: currentResponse.statusText,
      headers: currentResponse.headers || {},
      body: currentResponse.body || "",
    };

  const pushMessage = (from: "user" | "ai", text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2), from, text },
    ]);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingPanel.current && isFloating) {
        setFloatPos({
          x: Math.max(0, e.clientX - dragOffset.current.x),
          y: Math.max(0, e.clientY - dragOffset.current.y),
        });
        return;
      }

      if (isResizing.current && isFloating) {
        const dx = e.clientX - resizeStart.current.x;
        const dy = e.clientY - resizeStart.current.y;
        const dir = isResizing.current;

        setFloatSize((prev) => {
          let newW = prev.w;
          let newH = prev.h;
          if (dir.includes("right")) newW = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, resizeStart.current.w + dx));
          if (dir.includes("left")) newW = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, resizeStart.current.w - dx));
          if (dir.includes("bottom")) newH = Math.max(MIN_HEIGHT, resizeStart.current.h + dy);
          return { w: newW, h: newH };
        });

        if (isResizing.current.includes("left")) {
          setFloatPos((prev) => ({
            ...prev,
            x: Math.max(0, resizeStart.current.panelX + (e.clientX - resizeStart.current.x)),
          }));
        }
        return;
      }

      if (isResizing.current === "docked-left") {
        const dx = resizeStart.current.x - e.clientX;
        setDockedWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, resizeStart.current.w + dx)));
      }
    };

    const handleMouseUp = () => {
      isDraggingPanel.current = false;
      isResizing.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isFloating]);

  const startDrag = (e: React.MouseEvent) => {
    if (!isFloating) return;
    isDraggingPanel.current = true;
    dragOffset.current = { x: e.clientX - floatPos.x, y: e.clientY - floatPos.y };
    e.preventDefault();
  };

  const startResize = (e: React.MouseEvent, dir: string) => {
    isResizing.current = dir;
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      w: isFloating ? floatSize.w : dockedWidth,
      h: isFloating ? floatSize.h : 0,
      panelX: floatPos.x,
      panelY: floatPos.y,
    };
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDetailedRequest = async () => {
    if (!currentRequest) return;
    const req = buildRequestSummary();
    if (!req) return;
    setIsBusy(true);
    onSetExplanation("Generating in‑depth request explanation...");
    try {
      const result = await generateAiExplanation({ request: req, response: buildResponseSummary() || undefined, mode: "request", history: messages, activityName, activityId });
      onSetExplanation(result);
      pushMessage("ai", result);
    } finally { setIsBusy(false); }
  };

  const handleDetailedResponse = async () => {
    if (!currentRequest || !currentResponse) return;
    const req = buildRequestSummary();
    const res = buildResponseSummary();
    if (!req || !res) return;
    setIsBusy(true);
    onSetExplanation("Generating in‑depth response explanation...");
    try {
      const result = await generateAiExplanation({ request: req, response: res, mode: "response", history: messages, activityName, activityId });
      onSetExplanation(result);
      pushMessage("ai", result);
    } finally { setIsBusy(false); }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    const req = buildRequestSummary();
    const res = buildResponseSummary();
    setInput("");
    pushMessage("user", text);
    setIsBusy(true);
    onSetExplanation("Thinking...");
    try {
      const result = await generateAiExplanation({ request: req || undefined, response: req ? (res || undefined) : undefined, userQuestion: text, mode: "chat", history: messages, activityName, activityId });
      onSetExplanation(result);
      pushMessage("ai", result);
    } finally { setIsBusy(false); }
  };

  const handleApplyToRequest = async () => {
    const instruction = input.trim();
    if (!instruction || !currentActivity || !currentRequest) return;

    const contextKey = `callsensei.aiContext.${currentActivity.id}`;
    let terminalOutput = "";
    let editorFilePath = "";
    let editorFileContent = "";
    try {
      const raw = localStorage.getItem(contextKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { terminalOutput?: string; editorFilePath?: string; editorFileContent?: string };
        terminalOutput = parsed.terminalOutput || "";
        editorFilePath = parsed.editorFilePath || "";
        editorFileContent = parsed.editorFileContent || "";
      }
    } catch {
      // Optional context only.
    }

    setIsBusy(true);
    pushMessage("user", `Apply to request: ${instruction}`);
    onSetExplanation("Applying AI changes to request UI...");
    try {
      const aiUpdate = await generateAiUiEdit({
        request: buildRequestSummary(),
        response: buildResponseSummary() || undefined,
        userInstruction: instruction,
        terminalOutput,
        editorFilePath,
        editorFileContent,
        activityName,
        activityId,
      });

      const applied = buildActivityUpdateFromAiJson(currentActivity, aiUpdate);

      dispatch(updateActivity({
        id: currentActivity.id,
        data: applied.data,
      }));

      const notes = applied.notes;
      onSetExplanation(notes);
      pushMessage("ai", `Updated request UI.\nMethod: ${applied.nextRequest.method}\nURL: ${applied.nextRequest.url}\n${notes}`);
      setInput("");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to apply AI UI changes.";
      onSetExplanation(msg);
      pushMessage("ai", msg);
    } finally {
      setIsBusy(false);
    }
  };

  if (!isOpen) return null;

  const panelContent = (
    <div
      className="tour-ai-panel flex flex-col border border-slate-800/80 bg-gradient-to-b from-slate-950/95 via-slate-900/95 to-slate-950/95 shadow-2xl shadow-slate-950/90 overflow-hidden rounded-xl"
      style={
        isFloating
          ? {
            position: "fixed",
            left: floatPos.x,
            top: floatPos.y,
            width: floatSize.w,
            height: floatSize.h,
            zIndex: 9500,
            minWidth: MIN_WIDTH,
            minHeight: MIN_HEIGHT,
          }
          : {
            width: dockedWidth,
            flexShrink: 0,
            position: "relative",
            alignSelf: "flex-start",
            maxHeight: "calc(100vh - 4rem)",
          }
      }
    >
      {/* ── Floating resize handles ── */}
      {isFloating && (
        <>
          <div onMouseDown={(e) => startResize(e, "left")} className="absolute left-0 top-4 bottom-4 w-1.5 cursor-ew-resize hover:bg-cyan-500/40 rounded-full z-10" />
          <div onMouseDown={(e) => startResize(e, "right")} className="absolute right-0 top-4 bottom-4 w-1.5 cursor-ew-resize hover:bg-cyan-500/40 rounded-full z-10" />
          <div onMouseDown={(e) => startResize(e, "bottom")} className="absolute bottom-0 left-4 right-4 h-1.5 cursor-ns-resize hover:bg-cyan-500/40 rounded-full z-10" />
          <div onMouseDown={(e) => startResize(e, "bottom-left")} className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize z-20" />
          <div onMouseDown={(e) => startResize(e, "bottom-right")} className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize z-20" />
        </>
      )}

      {/* ── Docked left-edge resize handle ── */}
      {!isFloating && (
        <div
          onMouseDown={(e) => startResize(e, "docked-left")}
          className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-cyan-500/40 z-10"
        />
      )}

      {/* ── Header ── */}
      <div
        className={`flex-shrink-0 flex items-center justify-between p-4 border-b border-slate-800/80 ${isFloating ? "cursor-move select-none" : "cursor-default"}`}
        onMouseDown={startDrag}
      >
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-cyan-500/90 flex items-center justify-center shadow-lg shadow-cyan-500/60">
            <FaRobot className="text-slate-950 text-lg" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-base font-semibold text-white">AI Assistant</h2>
            <span className="text-[0.7rem] text-slate-400">Explain requests, responses & flows</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onFloatingChange(!isFloating)}
            className="text-[0.7rem] px-2 py-1 rounded-full border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
            title={isFloating ? "Dock to right side" : "Detach and float"}
          >
            {isFloating ? "Dock" : "Float"}
          </button>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors" aria-label="Close AI panel">
            <FiX className="text-xl" />
          </button>
        </div>
      </div>

      {/* ── Chat input ── */}
      <form
        onSubmit={handleSend}
        className="flex-shrink-0 px-3 pt-3 pb-2 border-b border-slate-800/80 flex items-center space-x-2 bg-slate-950/70"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={currentRequest ? "Ask about this request/response..." : "Ask the AI anything..."}
          className="flex-1 bg-slate-900/80 text-white text-xs px-3 py-2 rounded outline-none border border-slate-700 focus:border-cyan-400"
          disabled={isBusy}
        />
        <button
          type="submit"
          disabled={!input.trim() || isBusy}
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold px-3 py-2 rounded disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-cyan-500/60"
        >
          Send
        </button>
        <button
          type="button"
          onClick={handleApplyToRequest}
          disabled={!input.trim() || isBusy || !currentRequest}
          className="bg-violet-500 hover:bg-violet-400 text-slate-950 text-xs font-semibold px-3 py-2 rounded disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-violet-500/60"
          title="Use AI to update method/url/headers/body in the request UI"
        >
          Apply
        </button>
      </form>

      {/* ── Scrollable body ── */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="p-3 space-y-3">

          {/* Status bar */}
          <div className="bg-slate-900/70 rounded-lg px-3 py-2 flex items-center justify-between border border-slate-800/80">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-md shadow-emerald-400/90" />
              <span className="text-emerald-300 text-xs">AI Assistant Online</span>
            </div>
            {!currentRequest && (
              <span className="text-xs text-slate-400">Select a request to use AI.</span>
            )}
          </div>

          {/* Latest explanation */}
          <div className="bg-slate-900/70 rounded-lg p-3 border border-slate-800/80">
            <h3 className="text-sm font-semibold text-white mb-2">Latest Explanation</h3>
            <div className="max-h-36 overflow-y-auto custom-scrollbar">
              <p className="text-slate-200 text-xs whitespace-pre-line leading-relaxed">
                {explanation || "Send a request or ask a question to see AI explanations here."}
              </p>
            </div>
          </div>

          {/* In-depth analysis buttons */}
          <div className="bg-slate-900/70 rounded-lg p-3 space-y-2 border border-slate-800/80">
            <h3 className="text-sm font-semibold text-white">In-depth Analysis</h3>
            <button
              className="w-full bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-100 py-2 px-3 rounded text-xs disabled:opacity-40 disabled:cursor-not-allowed border border-cyan-400/40 transition-colors"
              onClick={handleDetailedRequest}
              disabled={!currentRequest || isBusy}
            >
              Provide AI in-depth explanation on request
            </button>
            <button
              className="w-full bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-100 py-2 px-3 rounded text-xs disabled:opacity-40 disabled:cursor-not-allowed border border-indigo-400/40 transition-colors"
              onClick={handleDetailedResponse}
              disabled={!currentRequest || !currentResponse || isBusy}
            >
              Provide AI in-depth explanation on response
            </button>
          </div>

          {/* ── Chat history ── */}
          <div className="bg-slate-900/70 rounded-lg p-3 border border-slate-800/80 flex flex-col min-h-[8rem]">
            <h3 className="text-sm font-semibold text-white mb-2 flex-shrink-0">Chat</h3>

            {/*
              chatScrollRef lives here — only THIS div scrolls on new messages.
              overflow-y-auto + max-h keeps it contained; scrollTop = scrollHeight
              in the useEffect targets this element directly, so the main window
              is never touched.
            */}
            <div
              ref={chatScrollRef}
              className="overflow-y-auto custom-scrollbar max-h-64 flex flex-col space-y-2"
            >
              {messages.length === 0 ? (
                <p className="text-xs text-slate-400">Ask the AI anything about this request or response.</p>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`text-xs px-2.5 py-1.5 rounded-lg max-w-[90%] whitespace-pre-wrap leading-relaxed ${m.from === "user"
                      ? "bg-cyan-500/90 text-slate-950 self-end shadow-md shadow-cyan-500/40"
                      : "bg-slate-800/90 text-slate-100 self-start border border-slate-700/80"
                      }`}
                  >
                    {m.text}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  if (isFloating) {
    return createPortal(panelContent, document.body);
  }

  return panelContent;
};

export default AIPanel;