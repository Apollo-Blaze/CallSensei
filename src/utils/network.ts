import type { Dispatch } from 'redux';
import type { RequestMethod } from '../models';
import { createResponse, calculateResponseSize, extractContentType, isSuccessfulResponse } from '../models';
import { renameActivity, setLatestResponse } from '../state/activitiesSlice';
import { generateAiExplanation } from '../services/aiService';

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
            setAIExplanation("Analyzing request...");

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

            // Combined AI explanation (request + response)
            setAIExplanation(await generateAiExplanation({
                request: reqData,
                response: {
                    status: responseData.status,
                    statusText: responseData.statusText,
                    headers: responseData.headers,
                    body: responseData.body
                }
            }));

            // Rename activity if it's a new request
            if (activityId && (activityName === 'New Request' || !activityName) && reqData.url) {
                dispatch(renameActivity({ id: activityId, name: reqData.url }));
            }

        } catch (e) {
            dispatch(setLatestResponse(null));
            const errorMessage = (e as Error).message;
            setAIExplanation("Failed to send request: " + errorMessage);

            // Provide AI context even when the request fails
            setAIExplanation(await generateAiExplanation({
                request: reqData,
                errorMessage
            }));
        }
    }
}; 