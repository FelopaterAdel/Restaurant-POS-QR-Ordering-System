import { api } from "@/lib/api";
import type { DashboardQueryParams, DashboardSummary } from "./dashboard.types";

export async function fetchDashboardSummary(
  params?: DashboardQueryParams,
): Promise<DashboardSummary> {
  const config = params?.date
    ? { params: { date: params.date } }
    : undefined;

  return api.get<DashboardSummary>("/dashboard/summary", config);
}
