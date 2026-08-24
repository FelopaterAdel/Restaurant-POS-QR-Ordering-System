import { Card, CardBody, OrderStatusBadge } from "@/components/ui";
import { formatTime } from "@/lib/format";
import type { Order } from "@/features/orders/orders.types";
import type { StatusAction } from "@/features/orders/orders.role-config";
import { getNextKitchenAction } from "../kitchen.actions";

export interface KitchenOrderCardProps {
  order: Order;
  onNextAction: (order: Order, action: StatusAction) => void;
  isUpdating?: boolean;
}

export function KitchenOrderCard({
  order,
  onNextAction,
  isUpdating,
}: KitchenOrderCardProps) {
  const action = getNextKitchenAction(order);

  return (
    <Card>
      <CardBody
        className={`kitchen-card${
          action ? "" : " kitchen-card--done"
        }`}
        aria-label={`Order #${order.orderNumber}, Table ${order.tableNumber}`}
      >
        <div className="kitchen-card__header">
          <h3 className="kitchen-card__number">#{order.orderNumber}</h3>
          <OrderStatusBadge status={order.status} />
        </div>

        <p className="kitchen-card__table">Table {order.tableNumber}</p>

        <ul className="kitchen-card__items">
          {order.items.map((item) => (
            <li key={item.id} className="kitchen-card__item">
              <span className="kitchen-card__item-name">
                {item.productName}
              </span>
              <span className="kitchen-card__item-qty">×{item.quantity}</span>
            </li>
          ))}
        </ul>

        <div className="kitchen-card__footer">
          <span className="kitchen-card__time">
            Created {formatTime(order.createdAt)}
          </span>
        </div>

        {action && (
          <button
            type="button"
            className="kitchen-card__action-btn"
            onClick={() => onNextAction(order, action)}
            disabled={isUpdating}
          >
            {action.label}
          </button>
        )}
      </CardBody>
    </Card>
  );
}
