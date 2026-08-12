import { apiClient } from "@/lib/api/client";

export interface HealthStatus {
  success: true;
  message: string;
}

export async function getHealth(): Promise<HealthStatus> {
  const { data } = await apiClient.get<HealthStatus>("/health");
  return data;
}
