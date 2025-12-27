/**
 * Shared AI Client for Vault Edge Functions
 * Uses OpenRouter for LLM access (model-agnostic, easy to swap)
 */

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

// Free models by rate limit (highest to lowest):
// - meta-llama/llama-3.2-3b-instruct:free  (~200/day, decent quality)
// - mistralai/mistral-7b-instruct:free     (~200/day, good quality)
// - qwen/qwen-2.5-72b-instruct:free        (~50/day, very good quality)
// - google/gemini-2.0-flash-exp:free       (~10-20/day, good quality)
//
// Paid models (when ready):
// - anthropic/claude-3.5-haiku ($0.25/1M tokens, best value)
// - openai/gpt-4o-mini ($0.15/1M tokens, cheapest)
const DEFAULT_MODEL = "meta-llama/llama-3.3-70b-instruct:free";

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
 * Get the model to use (from env or default)
 */
function getModel(configModel?: string): string {
  return configModel || Deno.env.get("AI_MODEL") || DEFAULT_MODEL;
}

/**
 * Make a chat completion request to OpenRouter
 * Returns the raw text response
 */
export async function chatCompletion(
  messages: ChatMessage[],
  config: AIClientConfig = {}
): Promise<string> {
  const apiKey = getApiKey();
  const model = getModel(config.model);

  console.log(`AI request: model=${model}, messages=${messages.length}`);

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
    console.error(`AI error: ${response.status} - ${errorText}`);

    const error: AIError = {
      status: response.status,
      message: getErrorMessage(response.status, errorText),
      retryable: response.status === 429 || response.status >= 500,
    };

    throw error;
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw { status: 500, message: "Empty response from AI", retryable: false };
  }

  console.log(`AI response received: ${content.length} chars`);
  return content;
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
