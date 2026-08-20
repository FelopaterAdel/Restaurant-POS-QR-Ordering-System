import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui";
import type { DashboardOrders } from "../dashboard.types";

export interface OrderStatusCardProps {
  orders: DashboardOrders;
}

interface StatusRow {
  label: string;
  count: number;
  tone: string;
}

function getStatuses(orders: DashboardOrders): StatusRow[] {
  return [
    { label: "Pending", count: orders.pending, tone: "warning" },
    { label: "Confirmed", count: orders.confirmed, tone: "info" },
    { label: "Preparing", count: orders.preparing, tone: "primary" },
    { label: "Ready", count: orders.ready, tone: "success" },
    { label: "Served", count: orders.served, tone: "neutral" },
    { label: "Completed", count: orders.completed, tone: "success" },
    { label: "Cancelled", count: orders.cancelled, tone: "danger" },
  ];
}

export function OrderStatusCard({ orders }: OrderStatusCardProps) {
  const statuses = getStatuses(orders);

  return (
    <Card className="order-status-card">
      <CardHeader>
        <CardTitle>Order Status</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="order-status-card__list">
          {statuses.map(({ label, count, tone }) => (
            <div key={label} className="order-status-card__row">
              <span className={`order-status-card__dot order-status-card__dot--${tone}`} />
              <span className="order-status-card__label">{label}</span>
              <span className="order-status-card__count">{count}</span>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
