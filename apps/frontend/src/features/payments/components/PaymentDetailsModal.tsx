import { Button, Modal, PaymentStatusBadge } from "@/components/ui";
import { formatCurrency, formatPaidAt } from "../history.format";
import type { PaymentHistoryItem } from "../history.types";

export interface PaymentDetailsModalProps {
  open: boolean;
  payment: PaymentHistoryItem | null;
  onClose: () => void;
}

export function PaymentDetailsModal({
  open,
  payment,
  onClose,
}: PaymentDetailsModalProps) {
  return (
    <Modal
      open={open}
      title="Payment Details"
      onClose={onClose}
      footer={
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      }
    >
      {payment && (
        <div className="payment-details">
          <p className="payment-details__heading">
            Order #{payment.orderNumber}
            <span className="payment-details__table">
              Table {payment.tableNumber}
            </span>
          </p>
          <dl className="payment-details__rows">
            <div className="payment-details__row">
              <dt>Amount</dt>
              <dd className="payment-details__amount">
                {formatCurrency(payment.amount)}
              </dd>
            </div>
            <div className="payment-details__row">
              <dt>Status</dt>
              <dd>
                <PaymentStatusBadge status={payment.status} />
              </dd>
            </div>
            <div className="payment-details__row">
              <dt>Method</dt>
              <dd>{payment.method === "CASH" ? "Cash" : "Card"}</dd>
            </div>
            <div className="payment-details__row">
              <dt>Paid At</dt>
              <dd>{formatPaidAt(payment.paidAt)}</dd>
            </div>
          </dl>
        </div>
      )}
    </Modal>
  );
}
