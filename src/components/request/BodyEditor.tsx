import React, { useState, useEffect } from "react";
import { BodyType } from "../../consts";

interface BodyEditorProps {
  body: string;
  bodyType: BodyType;
  variables: Record<string, string>;
  onBodyChange: (body: string) => void;
  onBodyTypeChange: (type: BodyType) => void;
  onVariablesChange: (vars: Record<string, string>) => void;
}

const BODY_TYPES: { value: BodyType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "text", label: "Text" },
  { value: "json", label: "JSON" },
];

const BodyEditor: React.FC<BodyEditorProps> = ({
  body,
  bodyType,
  variables,
  onBodyChange,
  onBodyTypeChange,
  onVariablesChange,
}) => {
  const [showVariables, setShowVariables] = useState(false);
  const varEntries = Object.entries(variables).filter(([k]) => k.trim());
  const [varRows, setVarRows] = useState<[string, string][]>([...varEntries, ["", ""]]);

  useEffect(() => {
    setVarRows([...varEntries, ["", ""]]);
  }, [variables]);

  const updateVariables = (rows: [string, string][]) => {
    const filtered = rows.filter(([k]) => k.trim());
    onVariablesChange(Object.fromEntries(filtered.map(([k, v]) => [k.trim(), v.trim()])));
  };

  const handleVarKeyChange = (i: number, key: string) => {
    const newRows = varRows.map(([k, v], idx) => (idx === i ? [key, v] : [k, v]));
    updateVariables(newRows);
  };

  const handleVarValueChange = (i: number, val: string) => {
    const newRows = varRows.map(([k, v], idx) => (idx === i ? [k, val] : [k, v]));
    updateVariables(newRows);
  };

  const handleVarDelete = (i: number) => {
    const newRows = varRows.filter((_, idx) => idx !== i);
    updateVariables(newRows.length ? newRows : [["", ""]]);
  };

  const handleVarAdd = () => {
    setVarRows((prev) => [...prev, ["", ""]]);
  };

  const formatJson = () => {
    if (bodyType !== "json") return;
    try {
      const parsed = JSON.parse(body);
      onBodyChange(JSON.stringify(parsed, null, 2));
    } catch {
      /* invalid json, ignore */
    }
  };

  return (
    <div className="mb-2 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <label className="block">Body</label>
        <div className="flex gap-1">
          {BODY_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onBodyTypeChange(value)}
              className={`px-2 py-1 rounded text-sm border ${
                bodyType === value
                  ? "bg-accent border-accent text-white"
                  : "bg-darkblue border-gray-500 text-gray-300 hover:border-gray-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {bodyType === "json" && (
          <button
            type="button"
            onClick={formatJson}
            className="text-xs text-accent hover:underline"
          >
            Format JSON
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowVariables(!showVariables)}
          className={`text-xs ${showVariables ? "text-accent" : "text-gray-400 hover:text-gray-300"}`}
        >
          Variables {showVariables ? "▼" : "▶"}
        </button>
      </div>

      {bodyType !== "none" && (
        <textarea
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          className="bg-darkblue p-2 rounded-sm w-full border-2 border-gray-400 text-white font-mono text-sm"
          rows={6}
          placeholder={
            bodyType === "json"
              ? '{"key": "value"}  — Use {{varName}} for variables'
              : "Plain text body. Use {{varName}} for variables"
          }
          spellCheck={false}
        />
      )}

      {showVariables && (
        <div className="rounded border-2 border-gray-400 overflow-hidden bg-darkblue/60 p-2">
          <p className="text-xs text-gray-400 mb-2">
            Use <code className="bg-gray-700 px-1 rounded">{`{{varName}}`}</code> in body to substitute.
          </p>
          <div className="space-y-1">
            {varRows.map(([k, v], i) => (
              <div key={i} className="flex gap-1 items-center">
                <input
                  type="text"
                  value={k}
                  onChange={(e) => handleVarKeyChange(i, e.target.value)}
                  placeholder="Variable name"
                  className="flex-1 min-w-0 max-w-[140px] bg-darkblue border border-gray-500 rounded px-2 py-1 text-white text-sm placeholder-gray-500"
                />
                <input
                  type="text"
                  value={v}
                  onChange={(e) => handleVarValueChange(i, e.target.value)}
                  placeholder="Value"
                  className="flex-[2] min-w-0 bg-darkblue border border-gray-500 rounded px-2 py-1 text-white text-sm placeholder-gray-500"
                />
                <button
                  type="button"
                  onClick={() => handleVarDelete(i)}
                  className="p-1 text-red-400 hover:text-red-300 rounded"
                  aria-label="Remove variable"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleVarAdd}
              className="text-sm text-accent hover:underline"
            >
              + Add variable
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BodyEditor;
