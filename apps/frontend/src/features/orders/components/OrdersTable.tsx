import { useCallback } from "react";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";
import { formatCurrency, formatTime } from "@/lib/format";
import type { Order } from "../orders.types";
import type { StatusAction } from "../orders.role-config";

export interface OrdersTableProps {
  orders: Order[];
  showItems: boolean;
  getRowActions?: (order: Order) => StatusAction[];
  onAction?: (order: Order, action: StatusAction) => void;
  isUpdating?: boolean;
  onRowClick: (order: Order) => void;
}

export function OrdersTable({
  orders,
  showItems,
  getRowActions,
  onAction,
  isUpdating,
  onRowClick,
}: OrdersTableProps) {
  const hasActionColumn =
    getRowActions !== undefined &&
    orders.some((order) => (getRowActions(order) ?? []).length > 0);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, order: Order) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onRowClick(order);
      }
    },
    [onRowClick],
  );

  return (
    <div className="orders-table-region">
      <Table aria-label="Orders">
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Order</TableHeaderCell>
            <TableHeaderCell>Table</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Items</TableHeaderCell>
            <TableHeaderCell>Time</TableHeaderCell>
            <TableHeaderCell>Total</TableHeaderCell>
            <TableHeaderCell>Payment</TableHeaderCell>
            {hasActionColumn && <TableHeaderCell>Actions</TableHeaderCell>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const actions = getRowActions ? getRowActions(order) : [];
            const itemCount = order.items.length;
            return (
              <TableRow
                key={order.id}
                className="orders-row"
                onClick={() => onRowClick(order)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => handleKeyDown(e, order)}
                aria-label={`Order #${order.orderNumber}, Table ${order.tableNumber}`}
              >
                <TableCell className="orders-row__number">
                  #{order.orderNumber}
                </TableCell>
                <TableCell>{order.tableNumber}</TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell>
                  {showItems
                    ? `${itemCount} ${itemCount === 1 ? "item" : "items"}`
                    : "—"}
                </TableCell>
                <TableCell className="orders-row__time">
                  {formatTime(order.createdAt)}
                </TableCell>
                <TableCell className="orders-row__total">
                  {formatCurrency(order.totalAmount)}
                </TableCell>
                <TableCell>
                  <PaymentStatusBadge status={order.paymentStatus} />
                </TableCell>
                {hasActionColumn && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {actions.length > 0 && onAction && (
                      <div className="orders-row__actions">
                        {actions.map((action) => (
                          <button
                            key={action.nextStatus}
                            type="button"
                            className={`order-card__action-btn order-card__action-btn--${action.variant}`}
                            disabled={isUpdating}
                            onClick={() => onAction(order, action)}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
