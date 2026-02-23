import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { SETTINGS_KEYS, getSetting } from "../utils/settings";

// Initialize the Gemini model
let model: ChatGoogleGenerativeAI | null = null;
let modelApiKey: string | null = null;
let modelId: string | null = null;

function resolveGeminiApiKey(): string | null {
    // Prefer user-provided key (settings) over build-time env.
    const fromSettings = getSetting(SETTINGS_KEYS.GEMINI_API_KEY);
    if (fromSettings && fromSettings.trim()) return fromSettings.trim();
    const fromEnv = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
    return fromEnv && fromEnv.trim() ? fromEnv.trim() : null;
}

function resolveGeminiModelId(): string {
    const stored = getSetting(SETTINGS_KEYS.AI_MODEL);
    return stored && stored.trim() ? stored.trim() : "gemini-2.5-flash-lite";
}

function getModel(): ChatGoogleGenerativeAI {
    const apiKey = resolveGeminiApiKey();
    if (!apiKey) {
        throw new Error("Gemini API key not found. Add it in Settings or set VITE_GEMINI_API_KEY in your .env file.");
    }

    const currentModelId = resolveGeminiModelId();

    // Recreate the model if the key or model changed.
    if (!model || modelApiKey !== apiKey || modelId !== currentModelId) {
        modelApiKey = apiKey;
        modelId = currentModelId;
        model = new ChatGoogleGenerativeAI({
            // Use a supported Gemini model ID for the public API
            // If this ever fails again, check the latest model IDs in Google AI Studio.
            model: currentModelId,
            temperature: 0.7,
            apiKey,
        });
    }
    return model!;
}

export interface AiRequestSummary {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: string;
}

export interface AiResponseSummary {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
}

type AiExplanationMode = "auto" | "request" | "response" | "chat";

export interface AiChatTurn {
    from: "user" | "ai";
    text: string;
}

interface AiExplanationArgs {
    request: AiRequestSummary;
    response?: AiResponseSummary;
    errorMessage?: string;
    userQuestion?: string;
    mode?: AiExplanationMode;
    history?: AiChatTurn[];
    activityName?: string;
    activityId?: string;
}

const truncateBody = (body: string, limit = 2000) =>
    body.length > limit ? `${body.substring(0, limit)}... (truncated)` : body || "Empty";

export interface AiCodeFixArgs {
    request: AiRequestSummary;
    response?: AiResponseSummary;
    errorMessage?: string;
    filePath: string;
    fileContent: string;
    activityName?: string;
    activityId?: string;
}

export async function generateAiCodeFix({
    request,
    response,
    errorMessage,
    filePath,
    fileContent,
    activityName,
    activityId,
}: AiCodeFixArgs): Promise<string> {
    try {
        const geminiModel = getModel();

        const systemPrompt = `You are an expert code reviewer and fixer. Analyze the HTTP request and response (if available) 
along with the provided source code file, and generate a fixed version of the code that addresses any issues 
identified in the request/response context.

Guidelines:
- Return ONLY the complete fixed code, ready to use (no explanations, no markdown code blocks, no diff format)
- Fix bugs, improve error handling, add missing functionality, or optimize based on the request/response analysis
- Maintain the same code style and structure
- If the file is TypeScript/JavaScript, ensure proper types and error handling
- Include all necessary imports and exports
- The output should be the complete file content, not a diff or patch`;

        const activitySection =
            (activityName || activityId)
                ? `Activity:
- Name: ${activityName || "Unknown"}
- Id: ${activityId || "Unknown"}`
                : "";

        const requestSection = `Request:
- Method: ${request.method}
- URL: ${request.url}
- Headers: ${JSON.stringify(request.headers, null, 2)}
- Body: ${request.body || "None"}`;

        const responseSection = response
            ? `Response:
- Status: ${response.status} ${response.statusText}
- Headers: ${JSON.stringify(response.headers, null, 2)}
- Body: ${truncateBody(response.body, 5000)}`
            : "Response: Not available yet.";

        const errorSection = errorMessage ? `Error: ${errorMessage}` : "";

        const userPrompt = `${activitySection ? activitySection + "\n\n" : ""}${requestSection}

${responseSection}

${errorSection ? errorSection + "\n\n" : ""}File to fix:
- Path: ${filePath}
- Current content:
\`\`\`
${fileContent}
\`\`\`

Analyze the request/response and the code file. Generate a fixed version of the code that addresses any issues.
Return ONLY the complete fixed code content, without markdown formatting or explanations.`;

        const messages = [
            new SystemMessage(systemPrompt),
            new HumanMessage(userPrompt),
        ];

        const result = await geminiModel.invoke(messages);
        console.log("[AI] Code fix generated:", result.content);
        
        // Clean up the response - remove markdown code blocks if present
        let fixedCode = result.content as string;
        // Remove markdown code blocks if present
        fixedCode = fixedCode.replace(/^```[\w]*\n/gm, '').replace(/^```$/gm, '').trim();
        
        return fixedCode;
    } catch (error) {
        console.error("Error generating AI code fix:", error);
        return error instanceof Error ? error.message : "Unable to generate AI code fix.";
    }
}

export async function generateAiExplanation({
    request,
    response,
    errorMessage,
    userQuestion,
    mode = "auto",
    history,
    activityName,
    activityId,
}: AiExplanationArgs): Promise<string> {
    try {
        const geminiModel = getModel();

        const systemPrompt = (() => {
            if (mode === "request") {
                return `You are an expert API assistant. Provide an in-depth but concise explanation of this HTTP request:
- What the endpoint is likely for
- Role of each important header and parameter
- Semantics of the body (if present)
- Any potential issues or improvements

Limit yourself to 5-7 short bullet points.`;
            }
            if (mode === "response") {
                return `You are an expert API assistant. Provide an in-depth analysis of this HTTP response:
- What the status code means in this context
- Whether the request was successful and why
- Key structure and meaning of the response body
- Any detected errors or edge cases
- Recommendations for next steps or fixes

Limit yourself to 5-7 short bullet points.`;
            }
            if (mode === "chat") {
                return `You are an expert API assistant having an interactive conversation with a developer.
Use the request/response as context, but Only answer the user's latest question based on the context provided.
Be concise, practical, and avoid repeating previously obvious details unless they are directly relevant.`;
            }
            // default "auto"
            return `You are an expert API assistant. Given the HTTP request (and optionally the response/error),
summarize what is happening, highlight important details, and suggest next steps if needed.
Keep the tone concise (3-4 sentences) and actionable.`;
        })();

        const activitySection =
            (activityName || activityId)
                ? `Activity:
- Name: ${activityName || "Unknown"}
- Id: ${activityId || "Unknown"}`
                : "";

        const requestSection = `Request:
- Method: ${request.method}
- URL: ${request.url}
- Headers: ${JSON.stringify(request.headers, null, 2)}
- Body: ${request.body || "None"}`;

        const responseSection = response
            ? `Response:
- Status: ${response.status} ${response.statusText}
- Headers: ${JSON.stringify(response.headers, null, 2)}
- Body: ${truncateBody(response.body)}`
            : "Response: Not available yet.";

        const errorSection = errorMessage ? `Error: ${errorMessage}` : "";

        const baseContext = `${activitySection ? activitySection + "\n\n" : ""}${requestSection}

${responseSection}

${errorSection}`.trim();

        const userPrompt =
            mode === "chat" && userQuestion
                ? `${baseContext}

User question:
${userQuestion}

Answer only the user's question based on the context above. Do not restate the whole request/response unless it is necessary to directly answer the question.`
                : `${baseContext}

Explain the intent of the request, what the response indicates, and recommend any follow-up actions or answers as appropriate.`;

        const historyMessages =
            history && history.length
                ? history.slice(-6).map((m) =>
                    m.from === "user"
                        ? new HumanMessage(m.text)
                        : new AIMessage(m.text)
                )
                : [];

        const messages = [
            new SystemMessage(systemPrompt),
            ...historyMessages,
            new HumanMessage(userPrompt),
        ];

        const explanation = await geminiModel.invoke(messages);
        console.log("[AI] Combined explanation:", explanation.content);
        return explanation.content as string;
    } catch (error) {
        console.error("Error generating AI explanation:", error);
        return error instanceof Error ? error.message : "Unable to generate AI explanation.";
    }
}