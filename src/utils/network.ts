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
import { getSetting, SETTINGS_KEYS } from "./settings";

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
    setAIExplanation: (explanation: string) => void,
    abortController?: AbortController
  ) => Promise<void>;
}

export const networkUtils: NetworkUtils = {
  sendHttpRequest: async (
    reqData,
    activityId,
    activityName,
    dispatch,
    setAIExplanation,
    abortController
  ) => {
    const startTime = Date.now();

    // Read both settings once at the top so every code path sees the same values
    const timeoutMs     = parseInt(getSetting(SETTINGS_KEYS.REQUEST_TIMEOUT_MS) ?? "30000", 10);
    const aiEnabled     = getSetting(SETTINGS_KEYS.AI_AUTO_ANALYZE) !== "false"; // default ON

    // ── Abort controller: combines timeout + manual cancel ───────────────────
    const internalController = new AbortController();
    if (abortController?.signal) {
      const ext = abortController.signal;
      if (ext.aborted) {
        internalController.abort();
      } else {
        ext.addEventListener("abort", () => internalController.abort(), { once: true });
      }
    }
    const timeoutId = setTimeout(
      () => internalController.abort(new DOMException("Request timed out", "TimeoutError")),
      timeoutMs
    );

    // Only show the "Analyzing…" placeholder when AI is actually going to run
    if (aiEnabled) setAIExplanation("Analyzing request...");

    try {
      const res = await fetch(reqData.url, {
        method:  reqData.method,
        headers: reqData.headers,
        body:    ["POST", "PUT", "PATCH"].includes(reqData.method) ? reqData.body : undefined,
        signal:  internalController.signal,
      });

      clearTimeout(timeoutId);

      const resBody         = await res.text();
      const responseHeaders = Object.fromEntries(res.headers.entries());
      const contentType     = extractContentType(responseHeaders);
      const responseSize    = calculateResponseSize(resBody);
      const duration        = Date.now() - startTime;

      const responseData = createResponse({
        requestId:  activityId || "",
        status:     res.status,
        statusText: res.statusText,
        headers:    responseHeaders,
        body:       resBody,
        duration,
        size:       responseSize,
        contentType,
        isSuccess:  isSuccessfulResponse(res.status),
      });

      if (activityId) {
        dispatch(updateActivity({ id: activityId, data: { response: responseData } }));
      }

      // ── AI analysis — gated by user preference ───────────────────────────
      if (aiEnabled) {
        try {
          const explanation = await generateAiExplanation({
            request: {
              method:  reqData.method,
              url:     reqData.url,
              headers: reqData.headers,
              body:    reqData.body,
            },
            response: {
              status:     responseData.status,
              statusText: responseData.statusText,
              headers:    responseData.headers,
              body:       responseData.body,
            },
            mode: "auto",
            activityId,
            activityName,
          });
          setAIExplanation(explanation);
        } catch {
          setAIExplanation(""); // clear placeholder silently if AI call fails
        }
      }
      // if !aiEnabled we never touched setAIExplanation, so the AI panel stays clean

      // ── Auto-rename if still "New Request" ───────────────────────────────
      if (activityId && (activityName === "New Request" || !activityName) && reqData.url) {
        dispatch(renameActivity({ id: activityId, name: reqData.url }));
      }

    } catch (e) {
      clearTimeout(timeoutId);

      const err         = e as Error;
      const isTimeout   = err.name === "TimeoutError" || err.message?.includes("timed out");
      const isCancelled = err.name === "AbortError" && !isTimeout;

      // Manual cancel — say nothing (or a brief note), never call AI
      if (isCancelled) {
        setAIExplanation("Request cancelled.");
        return;
      }

      // Timeout — show plain message; only call AI if user has it enabled
      if (isTimeout) {
        setAIExplanation(`Request timed out after ${timeoutMs / 1000}s.`);
        if (aiEnabled) {
          try {
            const explanation = await generateAiExplanation({
              request: { method: reqData.method, url: reqData.url, headers: reqData.headers, body: reqData.body },
              errorMessage: `Timed out after ${timeoutMs}ms`,
              mode: "auto",
              activityId,
              activityName,
            });
            setAIExplanation(explanation);
          } catch { /* keep the plain timeout message */ }
        }
        return;
      }

      // Network / other error — show plain message; only call AI if enabled
      const message = err.message;
      setAIExplanation("Failed to send request: " + message);
      if (aiEnabled) {
        try {
          const explanation = await generateAiExplanation({
            request: { method: reqData.method, url: reqData.url, headers: reqData.headers, body: reqData.body },
            errorMessage: message,
            mode: "auto",
            activityId,
            activityName,
          });
          setAIExplanation(explanation);
        } catch { /* keep the plain error message */ }
      }
    }
  },
};