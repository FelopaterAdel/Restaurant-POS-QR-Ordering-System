import { Button, Modal } from "@/components/ui";

function formatCurrency(value: number): string {
  return `${value.toLocaleString("en-US")} EGP`;
}

export interface PaymentSuccessModalProps {
  open: boolean;
  orderNumber: number;
  amount: number;
  onClose: () => void;
  onComplete: () => void;
  isCompleting: boolean;
  error: string | null;
}

export function PaymentSuccessModal({
  open,
  orderNumber,
  amount,
  onClose,
  onComplete,
  isCompleting,
  error,
}: PaymentSuccessModalProps) {
  return (
    <Modal
      open={open}
      title="Payment successful"
      onClose={isCompleting ? () => {} : onClose}
      footer={
        <div className="payment-success__actions">
          <Button
            variant="outline"
            size="lg"
            onClick={onClose}
            disabled={isCompleting}
          >
            Close
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={onComplete}
            loading={isCompleting}
          >
            Complete Order
          </Button>
        </div>
      }
    >
      <div className="payment-success" role="status">
        <span className="payment-success__check" aria-hidden="true">
          ✓
        </span>
        <p className="payment-success__heading">Payment successful</p>
        <div className="payment-success__info">
          <div className="payment-success__row">
            <span className="payment-success__label">Order</span>
            <span className="payment-success__value">#{orderNumber}</span>
          </div>
          <div className="payment-success__row">
            <span className="payment-success__label">Paid</span>
            <span className="payment-success__value payment-success__value--amount">
              {formatCurrency(amount)}
            </span>
          </div>
        </div>

        {error && <p className="payment-success__error">{error}</p>}
      </div>
    </Modal>
  );
}
