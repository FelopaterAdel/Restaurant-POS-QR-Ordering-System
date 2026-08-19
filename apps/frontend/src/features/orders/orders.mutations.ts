import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  cancelOrder,
  completeOrder,
  createOrder,
  payOrder,
  updateOrderStatus,
} from "./orders.api";
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
  });
}
