import { api } from "@/lib/api";
import type {
  AnalyticsRange,
  RevenueGranularity,
  RevenuePoint,
  StockSummary,
  TopProduct,
} from "./analytics.types";

export async function fetchTopProducts(
  range?: AnalyticsRange,
  limit = 10,
): Promise<TopProduct[]> {
  return api.get<TopProduct[]>("/dashboard/top-products", {
    params: { ...range, limit },
  });
}

export async function fetchRevenueTrend(
  range?: AnalyticsRange,
  granularity: RevenueGranularity = "day",
): Promise<RevenuePoint[]> {
  return api.get<RevenuePoint[]>("/dashboard/revenue", {
    params: { ...range, granularity },
  });
}

export async function fetchStockSummary(): Promise<StockSummary> {
  return api.get<StockSummary>("/dashboard/stock");
}
