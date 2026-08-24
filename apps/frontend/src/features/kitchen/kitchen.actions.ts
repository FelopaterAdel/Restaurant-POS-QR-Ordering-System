import type { OrderStatus } from "@/components/ui";
import type { Order } from "@/features/orders/orders.types";
import type { StatusAction } from "@/features/orders/orders.role-config";

const KITCHEN_STATUSES: readonly OrderStatus[] = [
  "CONFIRMED",
  "PREPARING",
  "READY",
];

export function isKitchenStatus(status: OrderStatus): boolean {
  return KITCHEN_STATUSES.includes(status);
}

export function getNextKitchenAction(order: Order): StatusAction | null {
  if (order.status === "CONFIRMED") {
    return {
      label: "Start Preparing",
      nextStatus: "PREPARING",
      variant: "primary",
    };
  }

  if (order.status === "PREPARING") {
    return { label: "Mark Ready", nextStatus: "READY", variant: "primary" };
  }

  return null;
}

export function sortByKitchenPriority(orders: Order[]): Order[] {
  return [...orders].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}
