import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../state/store';
import type { RequestMethod } from '../models';

export const useRequestFormState = (selectedId: string | null) => {
    const activity = useSelector((state: RootState) =>
        state.activities.activities.find(a => a.id === selectedId)
    );

    console.log(selectedId);

    const [method, setMethod] = useState<RequestMethod>(activity?.request.method || "GET");
    const [url, setUrl] = useState(activity?.url || "");
    const [headers, setHeaders] = useState(activity ? JSON.stringify(activity.request.headers, null, 2) : "{}");
    const [body, setBody] = useState(activity?.request.body || "");

    // Sync form state with selected activity
    useEffect(() => {
        setMethod(activity?.request.method || "GET");
        setUrl(activity?.url || "");
        setHeaders(activity ? JSON.stringify(activity.request.headers, null, 2) : "{}");
        setBody(activity?.request.body || "");
    }, [activity]);

    const resetForm = () => {
        setMethod("GET");
        setUrl("");
        setHeaders("{}");
        setBody("");
    };

    return {
        method,
        setMethod,
        url,
        setUrl,
        headers,
        setHeaders,
        body,
        setBody,
        resetForm,
        activity
    };
}; 