import React, { useState } from "react";
import { useSelector } from "react-redux";
import { FiX } from "react-icons/fi";
import { FaRobot } from "react-icons/fa";
import type { RootState } from "../../../state/store";
import type { RequestModel, ResponseModel } from "../../../models";
import { generateAiExplanation } from "../../../services/aiService";

interface AIPanelProps {
  isOpen: boolean;
  onClose: () => void;
  explanation: string;
  onSetExplanation: (text: string) => void;
  selectedId: string | null;
}

type ChatMessage = {
  id: string;
  from: "user" | "ai";
  text: string;
};

const AIPanel: React.FC<AIPanelProps> = ({
  isOpen,
  onClose,
  explanation,
  onSetExplanation,
  selectedId,
}) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isBusy, setIsBusy] = useState(false);

  const activities = useSelector((state: RootState) => state.activities.activities);
  const latestResponse = useSelector(
    (state: RootState) => state.activities.latestResponse
  );

  const currentRequest: RequestModel | undefined = activities.find(
    (r) => r.id === selectedId
  );

  const currentResponse: ResponseModel | null = latestResponse;

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

  const handleDetailedRequest = async () => {
    if (!currentRequest) return;
    const req = buildRequestSummary();
    if (!req) return;

    setIsBusy(true);
    onSetExplanation("Generating in‑depth request explanation...");
    try {
      const result = await generateAiExplanation({
        request: req,
        response: buildResponseSummary() || undefined,
        mode: "request",
        history: messages,
      });
      onSetExplanation(result);
      pushMessage("ai", result);
    } finally {
      setIsBusy(false);
    }
  };

  const handleDetailedResponse = async () => {
    if (!currentRequest || !currentResponse) return;

    const req = buildRequestSummary();
    const res = buildResponseSummary();
    if (!req || !res) return;

    setIsBusy(true);
    onSetExplanation("Generating in‑depth response explanation...");
    try {
      const result = await generateAiExplanation({
        request: req,
        response: res,
        mode: "response",
        history: messages,
      });
      onSetExplanation(result);
      pushMessage("ai", result);
    } finally {
      setIsBusy(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !currentRequest) return;

    const req = buildRequestSummary();
    const res = buildResponseSummary();
    if (!req) return;

    setInput("");
    pushMessage("user", text);
    setIsBusy(true);
    onSetExplanation("Thinking...");

    try {
      const result = await generateAiExplanation({
        request: req,
        response: res || undefined,
        userQuestion: text,
        mode: "chat",
        history: messages,
      });
      onSetExplanation(result);
      pushMessage("ai", result);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div
      className={`tour-ai-panel h-full bg-[#18182a] shadow-2xl transition-all duration-300 ease-in-out flex flex-col ${isOpen ? "w-96" : "w-0"
        } overflow-hidden`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <FaRobot className="text-white text-xl" />
          <h2 className="text-xl font-bold text-white">AI Assistant</h2>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Close AI panel"
        >
          <FiX className="text-xl" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-4">
        {/* Status */}
        <div className="bg-[#2a2a3a] rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-green-400 text-xs">
              AI Assistant Online
            </span>
          </div>
          {!currentRequest && (
            <span className="text-xs text-gray-400">
              Select or create a request to use AI.
            </span>
          )}
        </div>

        {/* Latest auto explanation */}
        <div className="bg-[#2a2a3a] rounded-lg p-3">
          <h3 className="text-sm font-semibold text-white mb-2">
            Latest Explanation
          </h3>
          <p className="text-gray-200 text-xs whitespace-pre-line">
            {explanation ||
              "Send a request or ask a question to see AI explanations here."}
          </p>
        </div>

        {/* In-depth buttons */}
        <div className="bg-[#2a2a3a] rounded-lg p-3 space-y-2">
          <h3 className="text-sm font-semibold text-white">
            In-depth Analysis
          </h3>
          <button
            className="w-full bg-[#3a3a4a] hover:bg-[#4a4a5a] text-white py-2 px-3 rounded text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={handleDetailedRequest}
            disabled={!currentRequest || isBusy}
          >
            Provide AI in-depth explanation on request
          </button>
          <button
            className="w-full bg-[#3a3a4a] hover:bg-[#4a4a5a] text-white py-2 px-3 rounded text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={handleDetailedResponse}
            disabled={!currentRequest || !currentResponse || isBusy}
          >
            Provide AI in-depth explanation on response
          </button>
        </div>

        {/* Chat history */}
        <div className="bg-[#2a2a3a] rounded-lg p-3 flex flex-col space-y-2 max-h-64 overflow-y-auto">
          <h3 className="text-sm font-semibold text-white mb-1">Chat</h3>
          {messages.length === 0 ? (
            <p className="text-xs text-gray-400">
              Ask the AI anything about this request or response.
            </p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`text-xs px-2 py-1 rounded max-w-full whitespace-pre-wrap ${m.from === "user"
                  ? "bg-blue-600 text-white self-end ml-8"
                  : "bg-[#1f1f33] text-gray-100 self-start mr-8"
                  }`}
              >
                {m.text}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat input */}
      <form
        onSubmit={handleSend}
        className="p-3 border-t border-gray-700 flex items-center space-x-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            currentRequest
              ? "Ask the AI about this request/response..."
              : "Select a request to start chatting..."
          }
          className="flex-1 bg-[#2a2a3a] text-white text-xs px-3 py-2 rounded outline-none border border-gray-700 focus:border-blue-500"
          disabled={!currentRequest || isBusy}
        />
        <button
          type="submit"
          disabled={!currentRequest || !input.trim() || isBusy}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default AIPanel; 