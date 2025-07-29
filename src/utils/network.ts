import type { Dispatch } from 'redux';
import type { RequestMethod } from '../models';
import { calculateResponseSize, extractContentType, isSuccessfulResponse} from '../models';
import type {ResponseModel} from '../models';
import { updateActivity , renameActivity } from '../state/activitiesSlice';
import {createResponse} from '../models';
import { createActivity } from '../models/ActivityModel';
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
            console.log("response body",resBody);
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

            const activityData = {
                response :responseData
            };

            


            console.log("just before dispatching");
            // dispatch(updateActivity({
            //     id: activityId!, // or the activity id
            //     data: activityData
            //   }));'

            dispatch(updateActivity({
                id: activityId!, // or the activity id
                data: {
                    name : 'govind',
                    url : 'http://google.com/'
                }
              }));
            
           // dispatch(setLatestResponse(responseData));
            setAIExplanation(await explainResponse(responseData));

            // Rename activity if it's a new request
            if (activityId && (activityName === 'New Request' || !activityName) && reqData.url) {
                dispatch(renameActivity({ id: activityId, name: reqData.url }));
            }
        } catch (e) {
            //dispatch(setLatestResponse(null));
            setAIExplanation("Failed to send request: " + (e as Error).message);
        }
    }
}; 