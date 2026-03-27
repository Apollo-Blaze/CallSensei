import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
    HumanMessage,
    SystemMessage,
    AIMessage,
    type BaseMessage,
} from "@langchain/core/messages";
import { SETTINGS_KEYS, getSetting } from "../utils/settings";

type AiProvider = "gemini" | "openai" | "groq";

interface ChatModelLike {
    invoke(messages: BaseMessage[]): Promise<AIMessage>;
}

// Single cached chat model (Gemini, OpenAI, or Groq) based on settings.
let cachedModel: ChatModelLike | null = null;
let cachedSignature: string | null = null;

function resolveProvider(): AiProvider {
    const fromSettings = getSetting(SETTINGS_KEYS.AI_PROVIDER) as AiProvider | null;
    if (fromSettings === "openai" || fromSettings === "groq" || fromSettings === "gemini") {
        return fromSettings;
    }
    return "gemini";
}

function resolveGeminiConfig(): { apiKey: string; model: string } {
    // Prefer user-provided key (settings) over build-time env.
    const fromSettings = getSetting(SETTINGS_KEYS.GEMINI_API_KEY);
    const apiKey =
        (fromSettings && fromSettings.trim()) ||
        (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim() ||
        "";
    if (!apiKey) {
        throw new Error(
            "Gemini API key not found. Add it in Settings or set VITE_GEMINI_API_KEY in your .env file.",
        );
    }

    const storedModel = getSetting(SETTINGS_KEYS.AI_MODEL);
    const model = storedModel && storedModel.trim() ? storedModel.trim() : "gemini-2.5-flash-lite";
    console.log("inside resolveGeminiConfigand apikey model ", model, apiKey)
    return { apiKey, model };
}

function resolveOpenAIConfig(): { apiKey: string; model: string; baseUrl: string } {
    const fromSettings = getSetting(SETTINGS_KEYS.OPENAI_API_KEY);
    const apiKey =
        (fromSettings && fromSettings.trim())
        || (import.meta.env.VITE_OPENAI_API_KEY as string | undefined)?.trim() ||
        "";
    if (!apiKey) {
        throw new Error(
            "OpenAI API key not found. Add it in Settings (AI & API) or set VITE_OPENAI_API_KEY in your .env file.",
        );
    }

    const storedModel = getSetting(SETTINGS_KEYS.OPENAI_MODEL);
    const model = storedModel && storedModel.trim() ? storedModel.trim() : "gpt-4.1-mini"; // 👈 fixed, reads from settings

    const storedBaseUrl = getSetting(SETTINGS_KEYS.OPENAI_BASE_URL);
    const baseUrl =
        (storedBaseUrl && storedBaseUrl.trim())
        || (import.meta.env.VITE_OPENAI_BASE_URL as string | undefined)?.trim()
        || "https://api.openai.com/v1";

    return { apiKey, model, baseUrl };
}

function resolveGroqConfig(): { apiKey: string; model: string } {
    console.log("inside resolveGroqConfig")
    const fromSettings = getSetting(SETTINGS_KEYS.GROQ_API_KEY);
    const apiKey =
        (fromSettings && fromSettings.trim()) ||
        (import.meta.env.VITE_GROQ_API_KEY as string | undefined)?.trim() ||
        "";
    if (!apiKey) {
        throw new Error(
            "Groq API key not found. Add it in Settings (AI & API) or set VITE_GROQ_API_KEY in your .env file.",
        );
    }

    const storedModel = getSetting(SETTINGS_KEYS.GROQ_MODEL);
    const model =
        storedModel && storedModel.trim() ? storedModel.trim() : "llama-3.3-70b-versatile";
    return { apiKey, model };
}

function toOpenAICompatibleMessages(messages: BaseMessage[]) {
    return messages.map((m) => {
        const type = m._getType();
        if (type === "system") {
            return { role: "system", content: m.content };
        }
        if (type === "ai") {
            return { role: "assistant", content: m.content };
        }
        // "human" and everything else maps to "user"
        return { role: "user", content: m.content };
    });
}

class OpenAIChatAdapter implements ChatModelLike {
    private apiKey: string;
    private model: string;
    private baseUrl: string; // 👈 new

    constructor(apiKey: string, model: string, baseUrl: string) { // 👈 new param
        this.apiKey = apiKey;
        this.model = model;
        this.baseUrl = baseUrl.replace(/\/$/, ""); // strip trailing slash
    }


    async invoke(messages: BaseMessage[]): Promise<AIMessage> {
        console.log("////////////////////////////openai model:", this.model);
        const payload = {
            model: this.model,
            messages: toOpenAICompatibleMessages(messages),
        };

        const response = await fetch(`${this.baseUrl}/chat/completions`, { // 👈 uses instance baseUrl
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`OpenAI API error (${response.status}): ${text}`);
        }

        const data = await response.json();
        const content =
            data.choices?.[0]?.message?.content ??
            "OpenAI did not return any content for this request.";
        return new AIMessage(content);
    }
}

class GroqChatAdapter implements ChatModelLike {
    private apiKey: string;
    private model: string;

    constructor(apiKey: string, model: string) {
        this.apiKey = apiKey;
        this.model = model;
    }

    async invoke(messages: BaseMessage[]): Promise<AIMessage> {
        const payload = {
            model: this.model,
            messages: toOpenAICompatibleMessages(messages),
        };

        // Groq exposes an OpenAI-compatible chat completions API.
        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify(payload),
            },
        );

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Groq API error (${response.status}): ${text}`);
        }

        const data = await response.json();
        const content =
            data.choices?.[0]?.message?.content ??
            "Groq did not return any content for this request.";
        return new AIMessage(content);
    }
}

function getModel(): ChatModelLike {
    const provider = resolveProvider();

    if (provider === "gemini") {
        const { apiKey, model } = resolveGeminiConfig();
        const signature = `gemini:${apiKey}:${model}`;
        if (!cachedModel || cachedSignature !== signature) {
            cachedModel = new ChatGoogleGenerativeAI({
                model,
                temperature: 0.7,
                apiKey,
            });
            cachedSignature = signature;
        }
        return cachedModel;
    }

    if (provider === "openai") {
        const { apiKey, model, baseUrl } = resolveOpenAIConfig(); // 👈 destructure baseUrl
        const signature = `openai:${apiKey}:${model}:${baseUrl}`;
        if (!cachedModel || cachedSignature !== signature) {
            cachedModel = new OpenAIChatAdapter(apiKey, model, baseUrl); // 👈 pass it
            cachedSignature = signature;
        }
        return cachedModel;
    }

    // provider === "groq"
    const { apiKey, model } = resolveGroqConfig();
    const signature = `groq:${apiKey}:${model}`;
    if (!cachedModel || cachedSignature !== signature) {
        cachedModel = new GroqChatAdapter(apiKey, model);
        cachedSignature = signature;
    }
    return cachedModel;
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
    request: AiRequestSummary | undefined;
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

export interface AiUiUpdate {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    body?: string;
    name?: string;
    request?: {
        method?: string;
        url?: string;
        headers?: Record<string, string>;
        body?: string;
        name?: string;
    };
    activity?: {
        id?: string;
        name?: string;
        url?: string;
        parentId?: string | null;
        request?: {
            method?: string;
            url?: string;
            headers?: Record<string, string>;
            body?: string;
            name?: string;
        };
    };
    notes?: string;
}

interface AiUiEditArgs {
    request?: AiRequestSummary;
    response?: AiResponseSummary;
    userInstruction: string;
    terminalOutput?: string;
    editorFilePath?: string;
    editorFileContent?: string;
    activityName?: string;
    activityId?: string;
}

function extractJsonObject(text: string): string | null {
    const trimmed = text.trim();
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = (fenced?.[1] ?? trimmed).trim();
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;
    return candidate.slice(start, end + 1);
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
        const chatModel = getModel();

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

        const result = await chatModel.invoke(messages);
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
        const chatModel = getModel();

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
Be concise, practical, and avoid repeating previously obvious details unless they are directly relevant. If the context is not provided and the question is related to API in general, explain it.`;
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
- Method: ${request?.method}
- URL: ${request?.url}
- Headers: ${JSON.stringify(request?.headers, null, 2)}
- Body: ${request?.body || "None"}`;

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

        console.log("messages", messages);

        const explanation = await chatModel.invoke(messages);
        console.log("[AI] Combined explanation:", explanation.content);
        return explanation.content as string;
    } catch (error) {
        console.error("Error generating AI explanation:", error);
        return error instanceof Error ? error.message : "Unable to generate AI explanation.";
    }
}

export async function generateAiUiEdit({
    request,
    response,
    userInstruction,
    terminalOutput,
    editorFilePath,
    editorFileContent,
    activityName,
    activityId,
}: AiUiEditArgs): Promise<AiUiUpdate> {
    const chatModel = getModel();

    const systemPrompt = `You are an API request editor assistant.
You MUST return valid JSON only (no markdown, no prose).

Return either of these shapes:
{
  "method": "GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS" or omit,
  "url": "full url string" or omit,
  "headers": { "Header-Name": "value", ... } or omit,
  "body": "raw request body string" or omit,
  "notes": "very short reason for the change"
}

OR (preferred, GitHub-style activity shape):
{
  "activity": {
    "name": "optional activity display name",
    "url": "optional activity url",
    "request": {
      "method": "GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS" or omit,
      "url": "full url string" or omit,
      "headers": { "Header-Name": "value", ... } or omit,
      "body": "raw request body string" or omit
    }
  },
  "notes": "very short reason for the change"
}

Rules:
- Use available context from request/response, terminal output, and editor file to apply the user's instruction.
- If instruction implies no change for a field, omit it.
- Preserve unknown headers unless instruction clearly replaces them.
- Keep output parseable JSON.`;

    const activitySection =
        (activityName || activityId)
            ? `Activity:
- Name: ${activityName || "Unknown"}
- Id: ${activityId || "Unknown"}`
            : "";

    const requestSection = request
        ? `Request:
- Method: ${request.method}
- URL: ${request.url}
- Headers: ${JSON.stringify(request.headers, null, 2)}
- Body: ${truncateBody(request.body, 4000)}`
        : "Request: Not available.";

    const responseSection = response
        ? `Response:
- Status: ${response.status} ${response.statusText}
- Headers: ${JSON.stringify(response.headers, null, 2)}
- Body: ${truncateBody(response.body, 3000)}`
        : "Response: Not available.";

    const terminalSection = terminalOutput
        ? `Terminal Output (recent):
${truncateBody(terminalOutput, 5000)}`
        : "Terminal Output: Not available.";

    const editorSection =
        editorFilePath || editorFileContent
            ? `Editor File:
- Path: ${editorFilePath || "Unknown"}
- Content:
\`\`\`
${truncateBody(editorFileContent || "", 8000)}
\`\`\``
            : "Editor File: Not available.";

    const userPrompt = `${activitySection ? activitySection + "\n\n" : ""}${requestSection}

${responseSection}

${terminalSection}

${editorSection}

User instruction:
${userInstruction}

Return JSON only.`;

    const result = await chatModel.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
    ]);

    const parsedRaw = extractJsonObject(String(result.content));
    if (!parsedRaw) {
        throw new Error("AI did not return valid JSON for UI update.");
    }
    const parsed = JSON.parse(parsedRaw) as AiUiUpdate;
    return parsed;
}