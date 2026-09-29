import { RESTAURANT_TIMEZONE } from "../../../config/restaurant.js";
import {
  AnthropicReportService,
  type AiReportProvider,
} from "../../../infra/ai/anthropic.service.js";
import { GetDashboardSummaryUseCase } from "../../dashboard/use-cases/get-dashboard-summary.use-case.js";
import { GetStockSummaryUseCase } from "../../dashboard/use-cases/get-stock-summary.use-case.js";
import { GetTopProductsUseCase } from "../../dashboard/use-cases/get-top-products.use-case.js";
import { ReportRepository } from "../repositories/report.repository.js";

export interface GenerateDailyReportInput {
  /** YYYY-MM-DD in the restaurant timezone. Defaults to yesterday. */
  date?: string;
}

function yesterdayInTimeZone(timeZone: string, now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  return parts;
}

export class GenerateDailyReportUseCase {
  private readonly summaryUseCase: GetDashboardSummaryUseCase;
  private readonly topProductsUseCase: GetTopProductsUseCase;
  private readonly stockUseCase: GetStockSummaryUseCase;
  private readonly reportRepository: ReportRepository;
  private readonly aiProvider: AiReportProvider;

  constructor(
    summaryUseCase: GetDashboardSummaryUseCase = new GetDashboardSummaryUseCase(),
    topProductsUseCase: GetTopProductsUseCase = new GetTopProductsUseCase(),
    stockUseCase: GetStockSummaryUseCase = new GetStockSummaryUseCase(),
    reportRepository: ReportRepository = new ReportRepository(),
    aiProvider: AiReportProvider = new AnthropicReportService(),
  ) {
    this.summaryUseCase = summaryUseCase;
    this.topProductsUseCase = topProductsUseCase;
    this.stockUseCase = stockUseCase;
    this.reportRepository = reportRepository;
    this.aiProvider = aiProvider;
  }

  async execute(input: GenerateDailyReportInput = {}) {
    const date =
      input.date ??
      yesterdayInTimeZone(RESTAURANT_TIMEZONE, new Date());

    const [summary, topProducts, stock] = await Promise.all([
      this.summaryUseCase.execute({ date }),
      this.topProductsUseCase.execute({ from: date, to: date, limit: 5 }),
      this.stockUseCase.execute(),
    ]);

    const data = {
      date,
      sales: {
        totalSales: summary.payments.totalSales,
        paidOrders: summary.payments.paidOrders,
        totalOrders: summary.orders.total,
        byStatus: summary.orders,
      },
      topProducts: topProducts.map((item) => ({
        name: item.productName,
        quantity: item.quantity,
        revenue: item.revenue,
      })),
      stock: {
        totalActive: stock.totalActive,
        lowCount: stock.lowCount,
        outOfStockCount: stock.outOfStockCount,
        lowStock: stock.lowStock.map((item) => ({
          name: item.name,
          unit: item.unit,
          quantityInStock: Number(item.quantityInStock),
          lowStockThreshold: Number(item.lowStockThreshold),
        })),
      },
    };

    const content = await this.aiProvider.generateSalesReport(data);

    return this.reportRepository.upsert({
      date,
      provider: this.aiProvider.name,
      model: this.aiProvider.model,
      summary: content.summary,
      recommendations: content.recommendations,
      data,
    });
  }
}
