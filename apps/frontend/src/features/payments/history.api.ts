import { api } from "@/lib/api";
import type {
  PaginatedPaymentHistory,
  PaymentHistoryItem,
  PaymentHistoryParams,
  PaymentSummary,
} from "./history.types";

export async function fetchPaymentHistory(
  params?: PaymentHistoryParams,
): Promise<PaginatedPaymentHistory> {
  return api.getPaginated<PaymentHistoryItem>("/payments/history", { params });
}

export async function fetchPaymentSummary(
  params?: Pick<PaymentHistoryParams, "from" | "to" | "orderNumber">,
): Promise<PaymentSummary> {
  return api.get<PaymentSummary>("/payments/summary", { params });
}
