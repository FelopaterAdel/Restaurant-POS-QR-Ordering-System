import type { OrderStatus } from "@/components/ui";
import type { Order } from "@/features/orders/orders.types";
import type { StatusAction } from "@/features/orders/orders.role-config";

export function isReadyStatus(status: OrderStatus): boolean {
  return status === "READY";
}

export function getNextWaiterAction(order: Order): StatusAction | null {
  if (order.status === "READY") {
    return { label: "Mark Served", nextStatus: "SERVED", variant: "primary" };
  }

  return null;
}

export function sortByReadyPriority(orders: Order[]): Order[] {
  return [...orders].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}
