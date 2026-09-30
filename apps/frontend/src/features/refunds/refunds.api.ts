import { api } from "@/lib/api";
import type { Refund, RefundStatus, RequestRefundInput } from "./refunds.types";

export async function listRefunds(
  status: RefundStatus = "PENDING",
): Promise<Refund[]> {
  return api.get<Refund[]>("/refunds", { params: { status } });
}

export async function requestRefund(input: RequestRefundInput): Promise<Refund> {
  return api.post<Refund>("/refunds", input);
}

export async function approveRefund(
  refundId: string,
  reason?: string | null,
): Promise<Refund> {
  return api.post<Refund>(`/refunds/${refundId}/approve`, { reason });
}

export async function rejectRefund(
  refundId: string,
  reason?: string | null,
): Promise<Refund> {
  return api.post<Refund>(`/refunds/${refundId}/reject`, { reason });
}
