/**
 * Shared AI Client for Vault Edge Functions
 * Uses OpenRouter for LLM access (model-agnostic, easy to swap)
 */

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

// Models tried in order — falls back automatically on 429/404
// Free tier first, paid llama as last resort if all free models rate-limit
const FREE_MODELS = [
  "openai/gpt-oss-120b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "google/gemma-3-12b-it:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "meta-llama/llama-3.3-70b-instruct", // paid fallback — only hits if all free models 429
];

//
// Other paid options (when ready to switch fully paid):
// - openai/gpt-4o-mini ($0.15/1M tokens, cheapest)
// - anthropic/claude-haiku-4-5 ($0.25/1M tokens, best quality/price)

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIClientConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIError {
  status: number;
  message: string;
  retryable: boolean;
}

/**
 * Get the OpenRouter API key from environment
 */
function getApiKey(): string {
  const key = Deno.env.get("OPENROUTER_API_KEY");
  if (!key) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }
  return key;
}

/**
 * Get ordered list of models to try
 */
function getModels(configModel?: string): string[] {
  const envModel = Deno.env.get("AI_MODEL");
  if (configModel) return [configModel];
  if (envModel) return [envModel, ...FREE_MODELS.filter(m => m !== envModel)];
  return FREE_MODELS;
}

/**
 * Make a single attempt to the OpenRouter chat completions endpoint
 */
async function attemptChatCompletion(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  config: AIClientConfig
): Promise<{ ok: boolean; status: number; content?: string; errorText?: string }> {
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://vault-app.com",
      "X-Title": "Vault AI Assistant",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxTokens ?? 2048,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { ok: false, status: response.status, errorText };
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    return { ok: false, status: 500, errorText: "Empty response from AI" };
  }

  return { ok: true, status: 200, content };
}

/**
 * Make a chat completion request to OpenRouter
 * Automatically falls back to next model on 429 or 404
 */
export async function chatCompletion(
  messages: ChatMessage[],
  config: AIClientConfig = {}
): Promise<string> {
  const apiKey = getApiKey();
  const models = getModels(config.model);

  let lastError: AIError | null = null;

  for (const model of models) {
    console.log(`AI request: model=${model}, messages=${messages.length}`);

    const result = await attemptChatCompletion(apiKey, model, messages, config);

    if (result.ok && result.content) {
      console.log(`AI response received from ${model}: ${result.content.length} chars`);
      return result.content;
    }

    console.error(`AI error from ${model}: ${result.status} - ${result.errorText}`);

    lastError = {
      status: result.status!,
      message: getErrorMessage(result.status!, result.errorText || ""),
      retryable: result.status === 429 || result.status! >= 500,
    };

    // Only fall back on rate limit (429) or model not found (404)
    if (result.status !== 429 && result.status !== 404) {
      break;
    }

    console.log(`Falling back from ${model} (${result.status})...`);
  }

  throw lastError ?? { status: 500, message: "AI request failed", retryable: false };
}

/**
 * Make a chat completion request expecting JSON response
 * Automatically parses and validates the response
 */
export async function jsonCompletion<T>(
  messages: ChatMessage[],
  config: AIClientConfig = {}
): Promise<T> {
  const content = await chatCompletion(messages, config);

  // Clean markdown code blocks if present
  let jsonString = content;
  if (content.includes("```json")) {
    jsonString = content.split("```json")[1].split("```")[0].trim();
  } else if (content.includes("```")) {
    jsonString = content.split("```")[1].split("```")[0].trim();
  }

  try {
    return JSON.parse(jsonString) as T;
  } catch (parseError) {
    console.error("Failed to parse AI response as JSON:", content);
    throw {
      status: 500,
      message: "Invalid JSON response from AI",
      retryable: true
    };
  }
}

/**
 * Convert API error status to user-friendly message
 */
function getErrorMessage(status: number, errorText: string): string {
  switch (status) {
    case 401:
      return "AI service authentication failed";
    case 402:
      return "AI credits exhausted. Please add credits.";
    case 403:
      return "AI service access denied. Please check your API key.";
    case 429:
      return "Rate limit exceeded. Please try again in a moment.";
    case 503:
      return "AI service temporarily unavailable";
    default:
      return `AI service error: ${status}`;
  }
}

/**
 * Check if an error is an AIError
 */
export function isAIError(error: unknown): error is AIError {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    "message" in error
  );
}
