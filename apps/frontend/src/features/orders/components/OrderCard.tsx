import { useCallback } from "react";
import { Card, CardBody, OrderStatusBadge } from "@/components/ui";
import type { Order } from "../orders.types";
import type { StatusAction } from "../orders.role-config";

function formatCurrency(value: number): string {
  return `EGP ${value.toLocaleString("en-US")}`;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export interface OrderCardProps {
  order: Order;
  onClick: (order: Order) => void;
  actions?: StatusAction[];
  onAction?: (order: Order, action: StatusAction) => void;
  isUpdating?: boolean;
}

export function OrderCard({
  order,
  onClick,
  actions,
  onAction,
  isUpdating,
}: OrderCardProps) {
  const itemCount = order.items.length;

  const handleActionClick = useCallback(
    (e: React.MouseEvent, action: StatusAction) => {
      e.stopPropagation();
      onAction?.(order, action);
    },
    [order, onAction],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick(order);
      }
    },
    [order, onClick],
  );

  return (
    <Card>
      <CardBody
        className="order-card"
        onClick={() => onClick(order)}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label={`Order #${order.orderNumber}, Table ${order.tableNumber}`}
      >
        <div className="order-card__header">
          <div>
            <h3 className="order-card__number">#{order.orderNumber}</h3>
            <p className="order-card__table">Table {order.tableNumber}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="order-card__meta">
          <span className="order-card__items">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </span>
          <span className="order-card__total">
            {formatCurrency(order.totalAmount)}
          </span>
        </div>

        <div className="order-card__footer">
          <span className="order-card__time">
            Created {formatTime(order.createdAt)}
          </span>
        </div>

        {actions && actions.length > 0 && onAction && (
          <div className="order-card__action-bar">
            {actions.map((action) => (
              <button
                key={action.nextStatus}
                type="button"
                className={`order-card__action-btn order-card__action-btn--${action.variant}`}
                onClick={(e) => handleActionClick(e, action)}
                disabled={isUpdating}
              >
                {action.variant === "primary" ? "✓ " : ""}
                {action.label}
              </button>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
