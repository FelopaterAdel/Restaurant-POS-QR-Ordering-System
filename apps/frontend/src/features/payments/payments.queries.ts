import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { OrderStatus } from "@/components/ui";
import { getOrderHistory } from "@/features/orders/orders.api";
import { orderKeys } from "@/features/orders/orders.queries";
import { listOrders } from "@/features/orders/orders.api";
import type { Order, OrderHistoryItem } from "@/features/orders/orders.types";

const PAYABLE_STATUSES: OrderStatus[] = ["READY", "SERVED"];
const QUEUE_LIMIT = 100;
const SEARCH_LIMIT = 10;

export interface PayableOrder {
  id: string;
  orderNumber: number;
  tableNumber: number;
  status: OrderStatus;
  totalAmount: number;
  itemCount: number | null;
}

export function isPayableOrderStatus(status: OrderStatus): boolean {
  return PAYABLE_STATUSES.includes(status);
}

export function toPayableOrderFromOrder(order: Order): PayableOrder {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    tableNumber: order.tableNumber,
    status: order.status,
    totalAmount: order.totalAmount,
    itemCount: order.items.length,
  };
}

export function toPayableOrderFromHistory(item: OrderHistoryItem): PayableOrder {
  return {
    id: item.id,
    orderNumber: item.orderNumber,
    tableNumber: item.table.number,
    status: item.status,
    totalAmount: item.totalAmount,
    itemCount: null,
  };
}

function isUnpaidPaymentStatus(status: string): boolean {
  return status === "PENDING";
}

export function usePayableOrdersQuery() {
  return useQuery({
    queryKey: orderKeys.list({ page: 1, limit: QUEUE_LIMIT }),
    queryFn: () => listOrders({ page: 1, limit: QUEUE_LIMIT }),
    select: (result) =>
      result.data
        .filter(
          (order) =>
            isPayableOrderStatus(order.status) &&
            isUnpaidPaymentStatus(order.paymentStatus),
        )
        .map(toPayableOrderFromOrder),
  });
}

export function usePayableOrderSearch(orderNumber: number | null) {
  const enabled = orderNumber !== null;

  const readyQuery = useQuery({
    queryKey: [
      ...orderKeys.history({
        orderNumber: orderNumber ?? undefined,
        status: "READY",
        page: 1,
        limit: SEARCH_LIMIT,
      }),
      "payable",
    ],
    queryFn: () =>
      getOrderHistory({
        orderNumber: orderNumber as number,
        status: "READY",
        page: 1,
        limit: SEARCH_LIMIT,
      }),
    enabled,
  });

  const servedQuery = useQuery({
    queryKey: [
      ...orderKeys.history({
        orderNumber: orderNumber ?? undefined,
        status: "SERVED",
        page: 1,
        limit: SEARCH_LIMIT,
      }),
      "payable",
    ],
    queryFn: () =>
      getOrderHistory({
        orderNumber: orderNumber as number,
        status: "SERVED",
        page: 1,
        limit: SEARCH_LIMIT,
      }),
    enabled,
  });

  return useMemo(() => {
    if (orderNumber === null) {
      return { data: null as PayableOrder[] | null, isLoading: false, error: null };
    }

    const data = [
      ...(readyQuery.data?.data ?? []),
      ...(servedQuery.data?.data ?? []),
    ]
      .filter((item) => isUnpaidPaymentStatus(item.payment.status))
      .sort((a, b) => a.orderNumber - b.orderNumber)
      .map(toPayableOrderFromHistory);

    return {
      data,
      isLoading: readyQuery.isLoading || servedQuery.isLoading,
      error: readyQuery.error ?? servedQuery.error,
    };
  }, [orderNumber, readyQuery.data, servedQuery.data, readyQuery.isLoading, servedQuery.isLoading, readyQuery.error, servedQuery.error]);
}
