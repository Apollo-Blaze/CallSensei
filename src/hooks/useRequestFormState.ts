import { useState, useEffect } from 'react';

import { useSelector ,  useDispatch, type TypedUseSelectorHook} from 'react-redux';
import type { RequestMethod } from '../models';
import type { RootState , AppDispatch } from '../state/store';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useRequestFormState = () => {
    const selectedActivityId = useSelector((state: RootState) => state.activities.selectedActivityId);
    const activity = useSelector((state: RootState) =>
        state.activities.activities.find(a => a.id === selectedActivityId)
    );

    // console.log('selectedActivityId', selectedActivityId);

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