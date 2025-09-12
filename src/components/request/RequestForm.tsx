import React from "react";
import { useDispatch } from "react-redux";
import { updateActivity } from "../../state/activitiesSlice";
import { useRequestFormState } from "../../hooks/useRequestFormState";
import { networkUtils } from "../../utils/network";
import MethodSelect from "./MethodSelect";
import UrlInput from "./UrlInput";
import "./RequestForm.css";

// import type { RootState } from "../../state/store";

const RequestForm: React.FC<{
    selectedId: string | null;
    setAIExplanation: (s: string) => void;
}> = ({ selectedId: _selectedId, setAIExplanation }) => {
    const dispatch = useDispatch();
    const {
        method,
        setMethod,
        url,
        setUrl,
        headers,
        setHeaders,
        body,
        setBody,
        activity
    } = useRequestFormState();

    // Keep track of last valid parsed headers to avoid losing data while typing invalid JSON
    const lastValidHeadersRef = React.useRef<Record<string, string>>({});

    // Initialize last valid headers when activity changes
    React.useEffect(() => {
        if (activity?.request?.headers) {
            lastValidHeadersRef.current = activity.request.headers;
        } else {
            lastValidHeadersRef.current = {};
        }
    }, [activity]);

    // Autosave on change (debounced)
    React.useEffect(() => {
        if (!activity?.id) return;

        const handle = setTimeout(() => {
            let parsedHeaders: Record<string, string> = lastValidHeadersRef.current || {};
            try {
                parsedHeaders = headers ? JSON.parse(headers) : {};
                lastValidHeadersRef.current = parsedHeaders;
            } catch {
                // Keep last valid headers if current JSON is invalid
                parsedHeaders = lastValidHeadersRef.current || {};
            }

            const nextRequest = {
                ...activity.request,
                method,
                url,
                headers: parsedHeaders,
                body
            };

            dispatch(updateActivity({
                id: activity.id,
                data: {
                    url,
                    request: nextRequest
                }
            }));
        }, 300);

        return () => clearTimeout(handle);
    }, [method, url, headers, body, activity, dispatch]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let parsedHeaders: Record<string, string> = {};
        try {
            parsedHeaders = headers ? JSON.parse(headers) : {};
        } catch {
            alert("Headers must be valid JSON");
            return;
        }
        
        const reqData = {
            method,
            url,
            headers: parsedHeaders,
            body
        };

        if (activity && activity.id) {
            dispatch(updateActivity({
                id: activity.id,
                data: {
                    url,
                    request: {
                        ...activity.request,
                        method,
                        url,
                        headers: parsedHeaders,
                        body
                    }
                }
            }));
        }

        await networkUtils.sendHttpRequest(
            reqData,
            activity?.id,
            activity?.name,
            dispatch as any,
            setAIExplanation
        );
    };

    return (
        <form className="p-4 rounded mb-4" onSubmit={handleSubmit}>
            <div className="mb-2 flex items-end gap-2">
                <MethodSelect method={method} onChange={setMethod} />
                <UrlInput url={url} onChange={setUrl} />
            </div>

            <div className="mb-2">
                <label className="block mb-1">Headers (JSON)</label>
                <textarea
                    value={headers}
                    onChange={e => setHeaders(e.target.value)}
                    className="bg-darkblue p-2 rounded-sm w-full border-2 border-gray-400 text-white"
                    rows={2}
                    placeholder='{"Authorization": "Bearer ..."}'
                />
            </div>

            <div className="mb-2">
                <label className="block mb-1">Body</label>
                <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    className="bg-darkblue p-2 rounded-sm w-full border-2 border-gray-400 text-white"
                    rows={4}
                    placeholder="{ &quot;key&quot;: &quot;value&quot; }"
                />
            </div>

            <button
                type="submit"
                className="bg-accent text-white font-bold px-4 py-2 rounded-sm border-2 border-gray-400 hover:bg-cyan-950"
            >
                Send Request
            </button>
        </form>
    );
};

export default RequestForm; 