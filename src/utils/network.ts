import type { Dispatch } from 'redux';
import type { RequestMethod } from '../models';
import { createResponse, calculateResponseSize, extractContentType, isSuccessfulResponse } from '../models';
import { updateActivity, renameActivity, setLatestResponse } from '../state/activitiesSlice';

interface RequestData {
    method: RequestMethod;
    url: string;
    headers: Record<string, string>;
    body: string;
}

interface NetworkUtils {
    sendHttpRequest: (
        reqData: RequestData,
        activityId: string | undefined,
        activityName: string | undefined,
        dispatch: Dispatch,
        setAIExplanation: (explanation: string) => void
    ) => Promise<void>;
}
 
export const networkUtils: NetworkUtils = {
    sendHttpRequest: async (
        reqData: RequestData,
        activityId: string | undefined,
        activityName: string | undefined,
        dispatch: Dispatch,
        setAIExplanation: (s: string) => void
    ) => {
        const startTime = Date.now();

        try {
            setAIExplanation("Loading explanation...");

            // TODO: Import real AI explanation functions
            const explainEndpoint = async (data: any) => "";
            const explainResponse = async (data: any) => "";

            setAIExplanation(await explainEndpoint(reqData));

            const res = await fetch(reqData.url, {
                method: reqData.method,
                headers: reqData.headers,
                body: ["POST", "PUT", "PATCH"].includes(reqData.method) ? reqData.body : undefined,
            });

            const resBody = await res.text();
            const responseHeaders = Object.fromEntries(res.headers.entries());
            const contentType = extractContentType(responseHeaders);
            const responseSize = calculateResponseSize(resBody);
            const duration = Date.now() - startTime;

            // Create response model
            const responseData = createResponse({
                requestId: activityId || '',
                status: res.status,
                statusText: res.statusText,
                headers: responseHeaders,
                body: resBody,
                duration,
                size: responseSize,
                contentType,
                isSuccess: isSuccessfulResponse(res.status),
            });

            // Update Redux state
            dispatch(setLatestResponse(responseData));
            setAIExplanation(await explainResponse(responseData));

            // Rename activity if it's a new request
            if (activityId && (activityName === 'New Request' || !activityName) && reqData.url) {
                dispatch(renameActivity({ id: activityId, name: reqData.url }));
            }

        } catch (e) {
            dispatch(setLatestResponse(null));
            setAIExplanation("Failed to send request: " + (e as Error).message);
        }
    }
}; 