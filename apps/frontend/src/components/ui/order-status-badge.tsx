import { Badge, type BadgeVariant } from "./badge";
import type { OrderStatus } from "./order-status";

const STATUS_VARIANT: Record<OrderStatus, BadgeVariant> = {
  PENDING: "warning",
  CONFIRMED: "info",
  PREPARING: "warning",
  READY: "info",
  SERVED: "neutral",
  PAID: "success",
  COMPLETED: "success",
  CANCELLED: "danger",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>;
}
