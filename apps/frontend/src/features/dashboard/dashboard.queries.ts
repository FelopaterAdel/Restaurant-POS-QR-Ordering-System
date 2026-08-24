import { useQuery } from "@tanstack/react-query";
import { fetchDashboardSummary } from "./dashboard.api";
import type { DashboardQueryParams } from "./dashboard.types";

export const DASHBOARD_REFETCH_INTERVAL_MS = 30_000;

export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: (params?: DashboardQueryParams) =>
    [...dashboardKeys.all, "summary", params] as const,
};

export function useDashboardQuery(params?: DashboardQueryParams) {
  return useQuery({
    queryKey: dashboardKeys.summary(params),
    queryFn: () => fetchDashboardSummary(params),
    staleTime: DASHBOARD_REFETCH_INTERVAL_MS,
    refetchInterval: DASHBOARD_REFETCH_INTERVAL_MS,
  });
}
