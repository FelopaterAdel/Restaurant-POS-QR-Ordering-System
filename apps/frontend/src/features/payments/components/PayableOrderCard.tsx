import { Button, OrderStatusBadge } from "@/components/ui";
import type { OrderStatus } from "@/components/ui";

function formatCurrency(value: number): string {
  return `${value.toLocaleString("en-US")} EGP`;
}

export interface PayableOrderCardProps {
  orderNumber: number;
  tableNumber: number;
  status: OrderStatus;
  totalAmount: number;
  itemCount: number | null;
  onPay: () => void;
}

export function PayableOrderCard({
  orderNumber,
  tableNumber,
  status,
  totalAmount,
  itemCount,
  onPay,
}: PayableOrderCardProps) {
  const paddedTable = String(tableNumber).padStart(2, "0");

  return (
    <div className="payable-card">
      <div className="payable-card__info">
        <div className="payable-card__title-row">
          <span className="payable-card__number">Order #{orderNumber}</span>
          <span className="payable-card__table">Table {paddedTable}</span>
        </div>
        {itemCount !== null && (
          <span className="payable-card__meta">{itemCount} items</span>
        )}
        <span className="payable-card__total">
          Total: {formatCurrency(totalAmount)}
        </span>
        <span className="payable-card__status">
          Status: <OrderStatusBadge status={status} />
        </span>
      </div>
      <Button
        variant="primary"
        size="lg"
        className="payable-card__pay-btn"
        onClick={onPay}
      >
        Pay
      </Button>
    </div>
  );
}
