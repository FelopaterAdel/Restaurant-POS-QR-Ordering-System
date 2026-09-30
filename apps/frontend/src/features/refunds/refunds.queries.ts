import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveRefund,
  listRefunds,
  rejectRefund,
  requestRefund,
} from "./refunds.api";
import type { RefundStatus, RequestRefundInput } from "./refunds.types";

export const refundKeys = {
  all: ["refunds"] as const,
  lists: () => [...refundKeys.all, "list"] as const,
  list: (status?: RefundStatus) => [...refundKeys.lists(), status] as const,
};

export function useRefundsQuery(status: RefundStatus = "PENDING") {
  return useQuery({
    queryKey: refundKeys.list(status),
    queryFn: () => listRefunds(status),
  });
}

export function useRequestRefundMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RequestRefundInput) => requestRefund(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: refundKeys.all });
    },
  });
}

export function useApproveRefundMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string | null }) =>
      approveRefund(id, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: refundKeys.all });
    },
  });
}

export function useRejectRefundMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string | null }) =>
      rejectRefund(id, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: refundKeys.all });
    },
  });
}
