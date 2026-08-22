import { useQuery } from "@tanstack/react-query";
import { getPublicMenu, getPublicOrder } from "./menu.api";
import type { PublicOrder } from "./menu.types";

export const menuKeys = {
  all: ["public-menu"] as const,
  menu: (qrCode: string) => [...menuKeys.all, qrCode] as const,
};

export const publicOrderKeys = {
  all: ["public-orders"] as const,
  order: (orderId: string) => [...publicOrderKeys.all, orderId] as const,
};

const ORDER_POLL_INTERVAL_MS = 10_000;

const TERMINAL_ORDER_STATUSES = new Set<PublicOrder["status"]>([
  "COMPLETED",
  "CANCELLED",
]);

function orderPollingInterval(order: PublicOrder | undefined): number | false {
  if (!order || TERMINAL_ORDER_STATUSES.has(order.status)) {
    return false;
  }
  return ORDER_POLL_INTERVAL_MS;
}

export function usePublicMenuQuery(qrCode: string) {
  return useQuery({
    queryKey: menuKeys.menu(qrCode),
    queryFn: () => getPublicMenu(qrCode),
    enabled: qrCode.length > 0,
    retry: false,
  });
}

export function usePublicOrderQuery(orderId: string, qrCode: string) {
  return useQuery({
    queryKey: publicOrderKeys.order(orderId),
    queryFn: () => getPublicOrder(orderId, qrCode),
    enabled: orderId.length > 0 && qrCode.length > 0,
    retry: false,
    refetchInterval: (query) => orderPollingInterval(query.state.data),
    refetchIntervalInBackground: false,
  });
}
