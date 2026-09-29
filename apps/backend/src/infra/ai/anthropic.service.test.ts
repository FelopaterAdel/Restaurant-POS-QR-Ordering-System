import { describe, expect, it, vi } from "vitest";
import {
  AnthropicReportService,
  AiProviderNotConfiguredError,
  buildSalesReportPrompt,
  parseSalesReportResponse,
} from "./anthropic.service.js";

const reportJson = JSON.stringify({
  summary: "Strong Friday with 40 orders.",
  recommendations: ["Add Friday staff", "Restock buns", "Promote cola"],
});

function fakeFetch(text: string, ok = true, status = 200) {
  return vi.fn(async () => ({
    ok,
    status,
    json: async () => ({
      content: [{ type: "text", text }],
    }),
  }));
}

describe("parseSalesReportResponse", () => {
  it("parses summary and recommendations", () => {
    expect(parseSalesReportResponse(reportJson)).toEqual({
      summary: "Strong Friday with 40 orders.",
      recommendations: ["Add Friday staff", "Restock buns", "Promote cola"],
    });
  });

  it("strips markdown fences", () => {
    expect(parseSalesReportResponse(`\`\`\`json\n${reportJson}\n\`\`\``)).toEqual(
      expect.objectContaining({ summary: "Strong Friday with 40 orders." }),
    );
  });

  it("rejects malformed responses", () => {
    expect(() => parseSalesReportResponse("not json")).toThrow();
    expect(() =>
      parseSalesReportResponse(JSON.stringify({ summary: "x" })),
    ).toThrow();
  });
});

describe("AnthropicReportService", () => {
  it("fails fast without an API key", async () => {
    const service = new AnthropicReportService("", "model-x");

    expect(service.isConfigured()).toBe(false);
    await expect(service.generateSalesReport({})).rejects.toBeInstanceOf(
      AiProviderNotConfiguredError,
    );
  });

  it("posts the prompt and parses the report", async () => {
    const fetchFn = fakeFetch(reportJson);
    const service = new AnthropicReportService(
      "sk_test",
      "model-x",
      fetchFn as never,
    );

    const result = await service.generateSalesReport({ date: "2026-09-27" });

    expect(result.summary).toBe("Strong Friday with 40 orders.");
    expect(result.recommendations).toHaveLength(3);
    const [, init] = fetchFn.mock.calls[0] as unknown as [
      string,
      { headers: Record<string, string>; body: string },
    ];
    expect(init.headers["x-api-key"]).toBe("sk_test");
    const body = JSON.parse(init.body);
    expect(body.model).toBe("model-x");
    expect(body.messages[0].content).toContain("2026-09-27");
  });

  it("surfaces provider HTTP failures", async () => {
    const service = new AnthropicReportService(
      "sk_test",
      "model-x",
      fakeFetch("{}", false, 429) as never,
    );

    await expect(service.generateSalesReport({})).rejects.toThrowError(
      /status 429/,
    );
  });

  it("builds a prompt embedding the data", () => {
    expect(buildSalesReportPrompt({ totalSales: 100 })).toContain(
      '"totalSales":100',
    );
  });
});
