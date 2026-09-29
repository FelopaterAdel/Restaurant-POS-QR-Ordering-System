import { api } from "@/lib/api";
import type { SalesReport } from "./reports.types";

export async function listReports(): Promise<SalesReport[]> {
  return api.get<SalesReport[]>("/reports");
}

export async function getLatestReport(): Promise<SalesReport> {
  return api.get<SalesReport>("/reports/latest");
}

export async function generateReport(date?: string): Promise<SalesReport> {
  return api.post<SalesReport>(
    "/reports/generate",
    date ? { date } : {},
  );
}
