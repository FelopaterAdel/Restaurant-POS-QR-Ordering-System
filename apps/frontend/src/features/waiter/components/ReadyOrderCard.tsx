import { Card, CardBody, OrderStatusBadge } from "@/components/ui";
import { formatTime } from "@/lib/format";
import type { Order } from "@/features/orders/orders.types";
import type { StatusAction } from "@/features/orders/orders.role-config";
import { getNextWaiterAction } from "../waiter.actions";

export interface ReadyOrderCardProps {
  order: Order;
  onMarkServed: (order: Order, action: StatusAction) => void;
  isUpdating?: boolean;
}

export function ReadyOrderCard({
  order,
  onMarkServed,
  isUpdating,
}: ReadyOrderCardProps) {
  const action = getNextWaiterAction(order);

  return (
    <Card>
      <CardBody
        className="ready-card"
        aria-label={`Order #${order.orderNumber}, Table ${order.tableNumber}`}
      >
        <div className="ready-card__header">
          <h3 className="ready-card__number">#{order.orderNumber}</h3>
          <span className="ready-card__table">Table {order.tableNumber}</span>
        </div>

        <ul className="ready-card__items">
          {order.items.map((item) => (
            <li key={item.id} className="ready-card__item">
              <span className="ready-card__item-name">{item.productName}</span>
              <span className="ready-card__item-qty">×{item.quantity}</span>
            </li>
          ))}
        </ul>

        <div className="ready-card__footer">
          <div className="ready-card__status">
            <OrderStatusBadge status={order.status} />
            <span className="ready-card__time">
              Created {formatTime(order.createdAt)}
            </span>
          </div>

          {action && (
            <button
              type="button"
              className="ready-card__action-btn"
              onClick={() => onMarkServed(order, action)}
              disabled={isUpdating}
            >
              {action.label}
            </button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
