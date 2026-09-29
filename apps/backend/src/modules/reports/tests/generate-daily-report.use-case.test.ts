import { describe, expect, it, vi } from "vitest";
import { GetDashboardSummaryUseCase } from "../../dashboard/use-cases/get-dashboard-summary.use-case.js";
import { GetStockSummaryUseCase } from "../../dashboard/use-cases/get-stock-summary.use-case.js";
import { GetTopProductsUseCase } from "../../dashboard/use-cases/get-top-products.use-case.js";
import { ReportRepository } from "../repositories/report.repository.js";
import { GenerateDailyReportUseCase } from "../use-cases/generate-daily-report.use-case.js";

function setup() {
  const summaryUseCase = {
    execute: vi.fn(async () => ({
      orders: {
        total: 40,
        pending: 0,
        confirmed: 0,
        preparing: 0,
        ready: 0,
        served: 0,
        completed: 38,
        cancelled: 2,
      },
      payments: { paidOrders: 38, totalSales: 5200 },
      sales: { granularity: "hourly", points: [] },
    })),
  } as unknown as GetDashboardSummaryUseCase;
  const topProductsUseCase = {
    execute: vi.fn(async () => [
      { productId: "p1", productName: "Margherita", quantity: 20, revenue: 3000 },
    ]),
  } as unknown as GetTopProductsUseCase;
  const stockUseCase = {
    execute: vi.fn(async () => ({
      totalActive: 5,
      lowCount: 1,
      outOfStockCount: 0,
      lowStock: [
        {
          id: "ing_1",
          name: "Flour",
          unit: "kg",
          quantityInStock: "5",
          lowStockThreshold: "10",
        },
      ],
    })),
  } as unknown as GetStockSummaryUseCase;
  const reportRepository = {
    upsert: vi.fn(async (input: unknown) => ({ id: "rep_1", ...(input as object) })),
  } as unknown as ReportRepository;
  const aiProvider = {
    name: "anthropic",
    model: "model-x",
    isConfigured: () => true,
    generateSalesReport: vi.fn(async (_data: unknown) => ({
      summary: "Strong day.",
      recommendations: ["Add staff", "Restock flour"],
    })),
  };
  const useCase = new GenerateDailyReportUseCase(
    summaryUseCase,
    topProductsUseCase,
    stockUseCase,
    reportRepository,
    aiProvider,
  );
  return {
    summaryUseCase,
    topProductsUseCase,
    stockUseCase,
    reportRepository,
    aiProvider,
    useCase,
  };
}

describe("GenerateDailyReportUseCase", () => {
  it("aggregates the day, asks the LLM and stores the report", async () => {
    const { summaryUseCase, reportRepository, aiProvider, useCase } = setup();

    const result = await useCase.execute({ date: "2026-09-27" });

    expect(summaryUseCase.execute).toHaveBeenCalledWith({ date: "2026-09-27" });
    expect(aiProvider.generateSalesReport).toHaveBeenCalledTimes(1);
    const data = vi.mocked(aiProvider.generateSalesReport).mock
      .calls[0]?.[0] as unknown as {
      sales: { totalSales: number };
      topProducts: Array<{ name: string }>;
    };
    expect(data.sales.totalSales).toBe(5200);
    expect(data.topProducts[0].name).toBe("Margherita");
    expect(reportRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        date: "2026-09-27",
        provider: "anthropic",
        model: "model-x",
        summary: "Strong day.",
        recommendations: ["Add staff", "Restock flour"],
      }),
    );
    expect(result).toMatchObject({ id: "rep_1", date: "2026-09-27" });
  });

  it("propagates LLM failures without storing", async () => {
    const { reportRepository, aiProvider, useCase } = setup();
    vi.mocked(aiProvider.generateSalesReport).mockRejectedValueOnce(
      new Error("provider down"),
    );

    await expect(useCase.execute({ date: "2026-09-27" })).rejects.toThrow(
      "provider down",
    );
    expect(reportRepository.upsert).not.toHaveBeenCalled();
  });
});
