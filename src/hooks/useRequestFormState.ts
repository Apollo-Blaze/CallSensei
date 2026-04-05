import { useState, useEffect, useRef } from 'react';

import { useSelector, useDispatch, type TypedUseSelectorHook } from 'react-redux';
import type { ActivityModel, RequestMethod } from '../models';
import type { RootState, AppDispatch } from '../state/store';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
function areRecordsEqual(left: Record<string, string> | undefined, right: Record<string, string> | undefined): boolean {
    if (left === right) return true;
    if (!left || !right) return false;
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length) return false;
    return leftKeys.every((key) => right[key] === left[key]);
}

export const useRequestFormState = () => {
    const selectedActivityId = useSelector((state: RootState) => state.activities.selectedActivityId);
    const activity = useSelector((state: RootState) =>
        state.activities.activities.find(a => a.id === selectedActivityId)
    );

    const [method, setMethod] = useState<RequestMethod>(activity?.request.method || "GET");
    const [url, setUrl] = useState(activity?.url || "");
    const [headers, setHeaders] = useState<Record<string, string>>(activity?.request.headers ?? {});
    const [body, setBody] = useState(activity?.request.body || "");
    const [queryParams, setQueryParams] = useState<Record<string, string>>(activity?.request.queryParams ?? {});
    const previousActivityRef = useRef<ActivityModel | null>(null);

    // Sync form state with selected activity and with external activity updates when the form has not diverged.
    useEffect(() => {
        const prevActivity = previousActivityRef.current;

        if (!activity) {
            previousActivityRef.current = null;
            return;
        }

        const isNewSelection = prevActivity?.id !== activity.id;
        const activityMethod = activity.request.method || "GET";
        const activityUrl = activity.url || "";
        const activityHeaders = activity.request.headers ?? {};
        const activityBody = activity.request.body || "";
        const activityQueryParams = activity.request.queryParams ?? {};

        if (isNewSelection) {
            setMethod(activityMethod);
            setUrl(activityUrl);
            setHeaders(activityHeaders);
            setBody(activityBody);
            setQueryParams(activityQueryParams);
        } else if (prevActivity) {
            if (activityMethod !== prevActivity.request.method && method === prevActivity.request.method) {
                setMethod(activityMethod);
            }
            if (activityUrl !== prevActivity.url && url === prevActivity.url) {
                setUrl(activityUrl);
            }
            if (!areRecordsEqual(activityHeaders, prevActivity.request.headers) && areRecordsEqual(headers, prevActivity.request.headers)) {
                setHeaders(activityHeaders);
            }
            if (activityBody !== prevActivity.request.body && body === prevActivity.request.body) {
                setBody(activityBody);
            }
            if (!areRecordsEqual(activityQueryParams, prevActivity.request.queryParams) && areRecordsEqual(queryParams, prevActivity.request.queryParams)) {
                setQueryParams(activityQueryParams);
            }
        }

        previousActivityRef.current = activity;
    }, [activity, method, url, headers, body, queryParams]);

    const resetForm = () => {
        setMethod("GET");
        setUrl("");
        setHeaders({});
        setBody("");
        setQueryParams({});
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
        queryParams,
        setQueryParams,
        resetForm,
        activity
    };
}; 