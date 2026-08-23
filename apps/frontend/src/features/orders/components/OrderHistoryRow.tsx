import { OrderStatusBadge } from "@/components/ui";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";
import type { OrderHistoryItem } from "../orders.types";

export interface OrderHistoryRowProps {
  order: OrderHistoryItem;
  onClick: (order: OrderHistoryItem) => void;
}

export function OrderHistoryRow({ order, onClick }: OrderHistoryRowProps) {
  return (
    <tr
      className="table__row history-row"
      onClick={() => onClick(order)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(order);
        }
      }}
      aria-label={`Order #${order.orderNumber}, Table ${order.table.number}`}
    >
      <td className="table__cell">#{order.orderNumber}</td>
      <td className="table__cell">{order.table.number}</td>
      <td className="table__cell history-row__amount">
        {formatCurrency(order.totalAmount)}
      </td>
      <td className="table__cell">
        <OrderStatusBadge status={order.status} />
      </td>
      <td className="table__cell history-row__date">
        <span>{formatDate(order.createdAt)}</span>
        <span className="history-row__time">{formatTime(order.createdAt)}</span>
      </td>
    </tr>
  );
}
