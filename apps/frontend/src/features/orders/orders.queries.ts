import { useQuery } from "@tanstack/react-query";
import {
  getOrder,
  getOrderHistory,
  getOrderQueue,
  getStaffOrderDetails,
  listOrders,
} from "./orders.api";
import type {
  ListOrdersParams,
  OrderHistoryParams,
  OrderQueueParams,
} from "./orders.types";

export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (params?: ListOrdersParams) => [...orderKeys.lists(), params] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (orderId: string) => [...orderKeys.details(), orderId] as const,
  queue: (params?: OrderQueueParams) =>
    [...orderKeys.all, "queue", params] as const,
  history: (params?: OrderHistoryParams) =>
    [...orderKeys.all, "history", params] as const,
  staffDetail: (orderId: string) =>
    [...orderKeys.all, "staff", orderId] as const,
};

export const OPERATIONS_POLL_INTERVAL_MS = 10_000;
export const HISTORY_POLL_INTERVAL_MS = 30_000;

export interface OrderQueryOptions {
  refetchInterval?: number;
  enabled?: boolean;
}

export function useOrdersQuery(params?: ListOrdersParams) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => listOrders(params),
  });
}

export function useOrderDetailQuery(orderId: string) {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => getOrder(orderId),
    enabled: orderId.length > 0,
  });
}

export function useOrderQueueQuery(
  params?: OrderQueueParams,
  options?: OrderQueryOptions,
) {
  return useQuery({
    queryKey: orderKeys.queue(params),
    queryFn: () => getOrderQueue(params),
    refetchInterval: options?.refetchInterval,
    refetchIntervalInBackground: false,
    enabled: options?.enabled ?? true,
  });
}

export function useOrderHistoryQuery(
  params?: OrderHistoryParams,
  options?: OrderQueryOptions,
) {
  return useQuery({
    queryKey: orderKeys.history(params),
    queryFn: () => getOrderHistory(params),
    refetchInterval: options?.refetchInterval,
    refetchIntervalInBackground: false,
    enabled: options?.enabled ?? true,
  });
}

export function useStaffOrderDetailsQuery(orderId: string) {
  return useQuery({
    queryKey: orderKeys.staffDetail(orderId),
    queryFn: () => getStaffOrderDetails(orderId),
    enabled: orderId.length > 0,
  });
}
