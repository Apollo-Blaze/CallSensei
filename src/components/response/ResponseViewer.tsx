import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../state/store";
import type { ResponseModel } from "../../models/ResponseModel";

// Define a type for the stored response
// Using the app's ResponseModel so we can access timestamp, etc.

const ResponseViewer: React.FC = () => {
    const response = useSelector(
        (state: RootState) => state.activities.latestResponse as ResponseModel | null
    );

    if (!response) {
        return (
            <div className="bg-darkblue-light p-4 rounded">
                No response yet.
            </div>
        );
    }

    const headers = response.headers as Record<string, string>;

    // Pretty format the body if JSON
    const body: string = (() => {
        if (typeof response.body === "string") {
            const text = response.body.trim();
            const looksJson = (text.startsWith("{") && text.endsWith("}")) || (text.startsWith("[") && text.endsWith("]"));
            if (looksJson) {
                try {
                    return JSON.stringify(JSON.parse(text), null, 2);
                } catch {
                    return response.body;
                }
            }
            return response.body;
        }
        return JSON.stringify(response.body, null, 2);
    })();

    const durationLabel = typeof response.duration === 'number' ? `${response.duration} ms` : '';

    return (
        <div className="bg-darkblue-light p-4 rounded mt-4 min-w-0">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Response</h3>
                <div className="flex items-center gap-4 text-sm">
                    <span className="font-mono">
                        {response.status} {response.statusText}
                    </span>
                    {durationLabel && <span className="opacity-80">{durationLabel}</span>}
                </div>
            </div>

            <div className="mb-2">
                <label className="block mb-1">Headers</label>
                <div className="bg-darkblue p-2 rounded-sm w-full border-2 border-gray-400 text-white text-xs max-h-40 overflow-y-auto whitespace-pre-wrap break-words">
                    {JSON.stringify(headers, null, 2)}
                </div>
            </div>

            <div className="mb-2">
                <label className="block mb-1">Body</label>
                <div className="bg-darkblue p-4 rounded-sm w-full border-2 border-gray-400 text-white text-xs max-h-60 overflow-y-auto overflow-x-auto">
                    <pre className="font-mono whitespace-pre-wrap break-words">{body}</pre>
                </div>
            </div>
        </div>
    );
};

export default ResponseViewer;