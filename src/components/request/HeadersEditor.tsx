import React, { useState, useEffect } from "react";
import { COMMON_HEADERS } from "../../consts";

interface HeadersEditorProps {
  headers: Record<string, string>;
  onChange: (headers: Record<string, string>) => void;
}

const HeadersEditor: React.FC<HeadersEditorProps> = ({ headers, onChange }) => {
  const [isOpen, setIsOpen] = useState(true);
  const entries = Object.entries(headers).filter(([k]) => k.trim());
  const [rows, setRows] = useState<[string, string][]>([...entries, ["", ""]]);

  useEffect(() => {
    setRows([...entries, ["", ""]]);
  }, [headers]);

  const updateHeaders = (newRows: [string, string][]) => {
    const filtered = newRows.filter(([k]) => k.trim());
    const obj = Object.fromEntries(
      filtered.map(([k, v]) => [k.trim(), v.trim()])
    );
    onChange(obj);
  };

  const handleKeyChange = (index: number, newKey: string) => {
    const newRows = rows.map(([k, v], i) =>
      i === index ? [newKey, v] : [k, v]
    );
    updateHeaders(newRows);
  };

  const handleValueChange = (index: number, newValue: string) => {
    const newRows = rows.map(([k, v], i) =>
      i === index ? [k, newValue] : [k, v]
    );
    updateHeaders(newRows);
  };

  const handleDelete = (index: number) => {
    const newRows = rows.filter((_, i) => i !== index);
    if (newRows.length === 0) newRows.push(["", ""]);
    updateHeaders(newRows);
  };

  const handleAdd = () => {
    setRows((prev) => [...prev, ["", ""]]);
  };

  return (
    <div className="mb-2 rounded border-2 border-gray-400 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-darkblue/80 px-3 py-2 text-left text-sm font-medium hover:bg-darkblue"
      >
        Headers
        <span className="text-gray-400">{isOpen ? "▼" : "▶"}</span>
      </button>
      {isOpen && (
        <div className="bg-darkblue/60 p-2 space-y-1">
          <datalist id="header-keys">
            {COMMON_HEADERS.map((h) => (
              <option key={h} value={h} />
            ))}
          </datalist>
          {rows.map(([key, value], i) => (
            <div key={i} className="flex gap-1 items-center">
              <input
                list="header-keys"
                value={key}
                onChange={(e) => handleKeyChange(i, e.target.value)}
                placeholder="Key"
                className="flex-1 min-w-0 max-w-[180px] bg-darkblue border border-gray-500 rounded px-2 py-1 text-white text-sm placeholder-gray-500"
              />
              <input
                type="text"
                value={value}
                onChange={(e) => handleValueChange(i, e.target.value)}
                placeholder="Value"
                className="flex-[2] min-w-0 bg-darkblue border border-gray-500 rounded px-2 py-1 text-white text-sm placeholder-gray-500"
              />
              <button
                type="button"
                onClick={() => handleDelete(i)}
                className="p-1 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded"
                aria-label="Remove header"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAdd}
            className="text-sm text-accent hover:underline"
          >
            + Add header
          </button>
        </div>
      )}
    </div>
  );
};

export default HeadersEditor;
