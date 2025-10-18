import { setTimeout as sleep } from "node:timers/promises";

import { fetch } from "undici";

import type { PromptDefinition } from "./schemas/prompt";

export interface OpenRouterClientConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  requestHeaders?: Record<string, string>;
  maxRetries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GenerateOptions {
  messages: ChatMessage[];
  promptMetadata?: PromptDefinition;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface GenerateResult {
  output: string;
  model: string;
  usage?: {
    totalTokens?: number;
    promptTokens?: number;
    completionTokens?: number;
  };
  raw: unknown;
}

export interface ComparisonResult {
  promptId: string;
  baseline: GenerateResult;
  customized: GenerateResult;
}

export class OpenRouterClient {
  private readonly apiKey: string;

  private readonly baseUrl: string;

  private readonly model: string;

  private readonly temperature: number;

  private readonly maxTokens: number;

  private readonly headers: Record<string, string>;

  private readonly maxRetries: number;

  private readonly retryDelayMs: number;

  private readonly timeoutMs: number;

  constructor(config: OpenRouterClientConfig = {}) {
    const apiKey = config.apiKey ?? process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not set. Provide it via .env or constructor config.");
    }

    this.apiKey = apiKey;
    this.baseUrl = config.baseUrl ?? process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
    this.model = config.model ?? process.env.OPENROUTER_MODEL ?? "openai/gpt-5";
    this.temperature = config.temperature ?? parseFloat(process.env.OPENROUTER_TEMPERATURE ?? "0.7");
    this.maxTokens = config.maxTokens ?? parseInt(process.env.OPENROUTER_MAX_TOKENS ?? "2048", 10);
    this.headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
      ...(config.requestHeaders ?? {})
    };
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelayMs = config.retryDelayMs ?? 1500;
    this.timeoutMs = config.timeoutMs ?? 60000;
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const payload = {
      model: options.model ?? this.model,
      messages: options.messages,
      temperature: options.temperature ?? this.temperature,
      max_tokens: options.maxTokens ?? this.maxTokens,
      metadata: options.promptMetadata
        ? {
            prompt_id: options.promptMetadata.id,
            prompt_domains: options.promptMetadata.domains,
            prompt_style_tags: options.promptMetadata.styleTags
          }
        : undefined
    };

    const response = await this.requestWithRetry("/chat/completions", payload);

    const output = response.choices?.[0]?.message?.content ?? "";
    return {
      output,
      model: response.model ?? payload.model,
      usage: response.usage,
      raw: response
    };
  }

  async compareWithInstructions(params: {
    prompt: PromptDefinition;
    systemInstructions: string;
    userInput?: string;
  }): Promise<ComparisonResult> {
    const userMessage = params.userInput ?? params.prompt.prompt;

    const baseline = await this.generate({
      messages: [
        { role: "system", content: "You are GPT-5 providing helpful, direct answers." },
        { role: "user", content: userMessage }
      ],
      promptMetadata: params.prompt
    });

    const customized = await this.generate({
      messages: [
        { role: "system", content: params.systemInstructions },
        { role: "user", content: userMessage }
      ],
      promptMetadata: params.prompt
    });

    return {
      promptId: params.prompt.id,
      baseline,
      customized
    };
  }

  private async requestWithRetry(endpoint: string, payload: unknown): Promise<any> {
    let attempt = 0;
    let lastError: Error | undefined;

    while (attempt <= this.maxRetries) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: "POST",
          headers: this.headers,
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(this.timeoutMs)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenRouter error (${response.status}): ${errorText}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        attempt += 1;
        if (attempt > this.maxRetries) {
          break;
        }
        const backoff = this.retryDelayMs * Math.max(1, Math.pow(2, attempt - 1));
        await sleep(backoff);
      }
    }

    throw lastError ?? new Error("Unknown OpenRouter client error");
  }
}

export function ensureOpenRouterConfig(): void {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("Missing OPENROUTER_API_KEY. Set it in your environment or .env file.");
  }
}
