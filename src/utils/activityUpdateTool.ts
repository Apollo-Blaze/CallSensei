import type { ActivityModel } from "../models/ActivityModel";
import type { RequestMethod, RequestModel } from "../models/RequestModel";
import type { AiUiUpdate } from "../services/aiService";

const ALLOWED_METHODS: RequestMethod[] = [
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "HEAD",
  "OPTIONS",
];

type ToolInputSchema = {
  type: "object";
  properties: Record<string, unknown>;
};

/**
 * Tool spec for model-side function calling.
 * This gives you a stable schema you can pass to providers that support tools.
 */
export const ACTIVITY_UI_UPDATE_TOOL: {
  name: string;
  description: string;
  inputSchema: ToolInputSchema;
} = {
  name: "update_activity_from_json",
  description:
    "Return JSON updates for activity UI fields (method, url, headers, body, name). Supports flat and GitHub-style activity JSON.",
  inputSchema: {
    type: "object",
    properties: {
      activity: {
        type: "object",
        properties: {
          name: { type: "string" },
          url: { type: "string" },
          request: {
            type: "object",
            properties: {
              method: { type: "string" },
              url: { type: "string" },
              headers: { type: "object" },
              body: { type: "string" },
            },
          },
        },
      },
      method: { type: "string" },
      url: { type: "string" },
      headers: { type: "object" },
      body: { type: "string" },
      notes: { type: "string" },
    },
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeHeaders(value: unknown, fallback: Record<string, string>): Record<string, string> {
  if (!isRecord(value)) return fallback;
  const next: Record<string, string> = {};
  for (const [k, v] of Object.entries(value)) {
    if (typeof v === "string") {
      next[k] = v;
    } else if (v !== undefined && v !== null) {
      next[k] = String(v);
    }
  }
  return next;
}

function toSafeMethod(value: unknown, fallback: RequestMethod): RequestMethod {
  if (typeof value !== "string") return fallback;
  const upper = value.toUpperCase() as RequestMethod;
  return ALLOWED_METHODS.includes(upper) ? upper : fallback;
}

export function buildActivityUpdateFromAiJson(
  currentActivity: ActivityModel,
  aiJson: AiUiUpdate,
): { data: Partial<ActivityModel>; nextRequest: RequestModel; notes: string } {
  const nested = aiJson.activity ?? {};
  const nestedRequest = nested.request ?? {};
  const directRequest = aiJson.request ?? {};

  const methodCandidate = nestedRequest.method ?? directRequest.method ?? aiJson.method;
  const urlCandidate = nestedRequest.url ?? directRequest.url ?? nested.url ?? aiJson.url;
  const headersCandidate = nestedRequest.headers ?? directRequest.headers ?? aiJson.headers;
  const bodyCandidate = nestedRequest.body ?? directRequest.body ?? aiJson.body;
  const nameCandidate = nested.name ?? directRequest.name ?? aiJson.name;

  const nextRequest: RequestModel = {
    ...currentActivity.request,
    method: toSafeMethod(methodCandidate, currentActivity.request.method),
    url: typeof urlCandidate === "string" ? urlCandidate : currentActivity.request.url,
    headers: sanitizeHeaders(headersCandidate, currentActivity.request.headers ?? {}),
    body: typeof bodyCandidate === "string" ? bodyCandidate : currentActivity.request.body ?? "",
  };

  const data: Partial<ActivityModel> = {
    name: typeof nameCandidate === "string" ? nameCandidate : currentActivity.name,
    url: nextRequest.url,
    request: {
      ...nextRequest,
      name: typeof nameCandidate === "string" ? nameCandidate : (nextRequest.name ?? currentActivity.name),
    },
  }
    if (nested.parentId !== undefined) {
    data.parentId = nested.parentId ?? undefined;
  }

  return {
    data,
    nextRequest,
    notes: aiJson.notes || "Applied AI activity updates.",
  };
}
