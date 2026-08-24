import { api } from "@/lib/api";
import type { DashboardQueryParams, DashboardSummary } from "./dashboard.types";

export async function fetchDashboardSummary(
  params?: DashboardQueryParams,
): Promise<DashboardSummary> {
  const query: Record<string, string> = {};

  if (params?.date) {
    query.date = params.date;
  }
  if (params?.from) {
    query.from = params.from;
  }
  if (params?.to) {
    query.to = params.to;
  }

  const config = Object.keys(query).length > 0 ? { params: query } : undefined;

  return api.get<DashboardSummary>("/dashboard/summary", config);
}
