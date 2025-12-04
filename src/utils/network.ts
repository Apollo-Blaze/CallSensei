import type { Dispatch } from "redux";
import type { RequestMethod } from "../models";
import {
    calculateResponseSize,
    extractContentType,
    isSuccessfulResponse,
    createResponse,
} from "../models";
import { updateActivity, renameActivity } from "../state/activitiesSlice";
import { generateAiExplanation } from "../services/aiService";

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
                body: ["POST", "PUT", "PATCH"].includes(reqData.method)
                    ? reqData.body
                    : undefined,
            });

            const resBody = await res.text();
            const responseHeaders = Object.fromEntries(res.headers.entries());
            const contentType = extractContentType(responseHeaders);
            const responseSize = calculateResponseSize(resBody);
            const duration = Date.now() - startTime;

            // Create response model
            const responseData = createResponse({
                requestId: activityId || "",
                status: res.status,
                statusText: res.statusText,
                headers: responseHeaders,
                body: resBody,
                duration,
                size: responseSize,
                contentType,
                isSuccess: isSuccessfulResponse(res.status),
            });

            // Attach response to the existing activity
            if (activityId) {
                dispatch(
                    updateActivity({
                        id: activityId,
                        data: { response: responseData },
                    })
                );
            }

            // Generate combined AI explanation (request + response)
            const explanation = await generateAiExplanation({
                request: {
                    method: reqData.method,
                    url: reqData.url,
                    headers: reqData.headers,
                    body: reqData.body,
                },
                response: {
                    status: responseData.status,
                    statusText: responseData.statusText,
                    headers: responseData.headers,
                    body: responseData.body,
                },
                mode: "auto",
                activityId,
                activityName,
            });

            setAIExplanation(explanation);

            // Rename activity if it's a new request
            if (
                activityId &&
                (activityName === "New Request" || !activityName) &&
                reqData.url
            ) {
                dispatch(renameActivity({ id: activityId, name: reqData.url }));
            }
        } catch (e) {
            const message = (e as Error).message;
            setAIExplanation("Failed to send request: " + message);

            // Optional: AI explanation of the failure
            try {
                const explanation = await generateAiExplanation({
                    request: {
                        method: reqData.method,
                        url: reqData.url,
                        headers: reqData.headers,
                        body: reqData.body,
                    },
                    errorMessage: message,
                    mode: "auto",
                    activityId,
                    activityName,
                });
                setAIExplanation(explanation);
            } catch {
                // fall back to plain error message only
            }
        }
    },
};