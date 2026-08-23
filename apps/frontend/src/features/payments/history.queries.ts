import { useQuery } from "@tanstack/react-query";
import { fetchPaymentHistory, fetchPaymentSummary } from "./history.api";
import type {
  PaymentHistoryParams,
  PaymentSummaryParams,
} from "./history.types";

export const paymentKeys = {
  all: ["payments"] as const,
  history: (params?: PaymentHistoryParams) =>
    [...paymentKeys.all, "history", params] as const,
  summary: (params?: PaymentSummaryParams) =>
    [...paymentKeys.all, "summary", params] as const,
};

export function usePaymentHistoryQuery(params?: PaymentHistoryParams) {
  return useQuery({
    queryKey: paymentKeys.history(params),
    queryFn: () => fetchPaymentHistory(params),
    staleTime: 30_000,
  });
}

export function usePaymentSummaryQuery(params?: PaymentSummaryParams) {
  return useQuery({
    queryKey: paymentKeys.summary(params),
    queryFn: () => fetchPaymentSummary(params),
    staleTime: 30_000,
  });
}
