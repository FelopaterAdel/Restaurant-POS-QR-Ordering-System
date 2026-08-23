import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  cancelOrder,
  completeOrder,
  createOrder,
  payOrder,
  updateOrderStatus,
} from "./orders.api";
import { isStalePaymentError } from "./orders.errors";
import { orderKeys } from "./orders.queries";
import type {
  CancelOrderInput,
  CreatePaymentInput,
  UpdateOrderStatusInput,
} from "./orders.types";

export function useCreateOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });
}

export function useUpdateOrderStatusMutation(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateOrderStatusInput) =>
      updateOrderStatus(orderId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

export function useCancelOrderMutation(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input?: CancelOrderInput) => cancelOrder(orderId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });
}

export function useCompleteOrderMutation(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => completeOrder(orderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });
}

export function usePayOrderMutation(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePaymentInput) => payOrder(orderId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
    // The backend rejected the payment because our copy of the order is
    // outdated (paid elsewhere, no longer payable, or removed). Refetch so
    // the UI reflects the real state instead of staying stale.
    onError: (error) => {
      if (isStalePaymentError(error)) {
        void queryClient.invalidateQueries({ queryKey: orderKeys.all });
      }
    },
  });
}
