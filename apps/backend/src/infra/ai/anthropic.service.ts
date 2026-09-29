import { env } from "../../config/env.js";
import { BadRequestError } from "../../errors/app-error.js";
import { AppErrorCode } from "../../errors/codes.js";

export class AiProviderNotConfiguredError extends BadRequestError {
  constructor() {
    super(
      AppErrorCode.AI_PROVIDER_NOT_CONFIGURED,
      "AI report generation is not configured",
    );
    this.name = "AiProviderNotConfiguredError";
  }
}

export interface AiReportContent {
  summary: string;
  recommendations: string[];
}

export interface AiReportProvider {
  readonly name: string;
  readonly model: string;
  isConfigured(): boolean;
  generateSalesReport(data: unknown): Promise<AiReportContent>;
}

type FetchFn = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string },
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

export function buildSalesReportPrompt(data: unknown): string {
  return [
    "You are a restaurant business analyst. Analyze the JSON summary of",
    "yesterday's restaurant performance below.",
    "",
    "Respond with JSON only, no markdown fences, in this exact shape:",
    '{"summary": "<2-3 sentence natural-language summary>", "recommendations": ["<concrete action 1>", "<concrete action 2>", "<concrete action 3>"]}',
    "Give 2-3 concrete, actionable recommendations (staffing, stock, pricing, promotions).",
    "",
    "DATA:",
    JSON.stringify(data),
  ].join("\n");
}

export function parseSalesReportResponse(text: string): AiReportContent {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const parsed = JSON.parse(cleaned) as {
    summary?: unknown;
    recommendations?: unknown;
  };
  if (typeof parsed.summary !== "string" || !Array.isArray(parsed.recommendations)) {
    throw new Error("LLM response is not a sales report");
  }
  const recommendations = parsed.recommendations
    .filter((item): item is string => typeof item === "string")
    .slice(0, 3);
  if (recommendations.length === 0) {
    throw new Error("LLM response has no recommendations");
  }
  return { summary: parsed.summary, recommendations };
}

/**
 * Anthropic Messages API implementation of daily sales reports.
 * Fetch is injectable so tests never touch the network.
 */
export class AnthropicReportService implements AiReportProvider {
  readonly name = "anthropic";
  readonly model: string;
  private readonly apiKey: string;
  private readonly fetchFn: FetchFn;

  constructor(
    apiKey: string = env.ai.apiKey,
    model: string = env.ai.model,
    fetchFn: FetchFn = fetch as unknown as FetchFn,
  ) {
    this.apiKey = apiKey;
    this.model = model;
    this.fetchFn = fetchFn;
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  async generateSalesReport(data: unknown): Promise<AiReportContent> {
    if (!this.isConfigured()) {
      throw new AiProviderNotConfiguredError();
    }

    const res = await this.fetchFn(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1024,
        messages: [{ role: "user", content: buildSalesReportPrompt(data) }],
      }),
    });

    if (!res.ok) {
      throw new BadRequestError(
        AppErrorCode.AI_PROVIDER_NOT_CONFIGURED,
        `AI provider request failed with status ${res.status}`,
      );
    }

    const body = (await res.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const text = body.content
      ?.filter((block) => block.type === "text" && typeof block.text === "string")
      .map((block) => block.text as string)
      .join("\n");

    if (!text) {
      throw new Error("AI provider returned no text");
    }

    return parseSalesReportResponse(text);
  }
}
