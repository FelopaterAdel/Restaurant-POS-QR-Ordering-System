import { useQuery } from "@tanstack/react-query";
import { fetchDashboardSummary } from "./dashboard.api";
import type { DashboardQueryParams } from "./dashboard.types";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: (params?: DashboardQueryParams) =>
    [...dashboardKeys.all, "summary", params] as const,
};

export function useDashboardQuery(params?: DashboardQueryParams) {
  return useQuery({
    queryKey: dashboardKeys.summary(params),
    queryFn: () => fetchDashboardSummary(params),
    staleTime: 30_000,
  });
}
