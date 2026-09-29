import { useQuery } from "@tanstack/react-query";
import {
  fetchRevenueTrend,
  fetchStockSummary,
  fetchTopProducts,
} from "./analytics.api";
import type {
  AnalyticsRange,
  RevenueGranularity,
} from "./analytics.types";

export const analyticsKeys = {
  all: ["analytics"] as const,
  topProducts: (range?: AnalyticsRange, limit?: number) =>
    [...analyticsKeys.all, "top-products", range, limit] as const,
  revenue: (range?: AnalyticsRange, granularity?: RevenueGranularity) =>
    [...analyticsKeys.all, "revenue", range, granularity] as const,
  stock: () => [...analyticsKeys.all, "stock"] as const,
};

export function useTopProductsQuery(range?: AnalyticsRange, limit = 10) {
  return useQuery({
    queryKey: analyticsKeys.topProducts(range, limit),
    queryFn: () => fetchTopProducts(range, limit),
  });
}

export function useRevenueTrendQuery(
  range?: AnalyticsRange,
  granularity: RevenueGranularity = "day",
) {
  return useQuery({
    queryKey: analyticsKeys.revenue(range, granularity),
    queryFn: () => fetchRevenueTrend(range, granularity),
  });
}

export function useStockSummaryQuery() {
  return useQuery({
    queryKey: analyticsKeys.stock(),
    queryFn: fetchStockSummary,
  });
}
