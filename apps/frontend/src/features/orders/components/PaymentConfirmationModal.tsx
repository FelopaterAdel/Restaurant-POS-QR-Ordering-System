import { useCallback, useState } from "react";
import { Button, Modal, Spinner } from "@/components/ui";
import type { PaymentMethod } from "@/components/ui";

function formatCurrency(value: number): string {
  return `EGP ${value.toLocaleString("en-US")}`;
}

export interface PaymentConfirmationModalProps {
  open: boolean;
  orderNumber: number;
  totalAmount: number;
  onClose: () => void;
  onConfirm: (method: PaymentMethod) => void;
  isProcessing: boolean;
  error: string | null;
}

const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string }> = [
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
];

export function PaymentConfirmationModal({
  open,
  orderNumber,
  totalAmount,
  onClose,
  onConfirm,
  isProcessing,
  error,
}: PaymentConfirmationModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("CASH");

  const handleConfirm = useCallback(() => {
    onConfirm(method);
  }, [onConfirm, method]);

  return (
    <Modal
      open={open}
      title="Confirm Payment"
      onClose={isProcessing ? () => {} : onClose}
      footer={
        <div className="payment-confirm__actions">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? <Spinner /> : "Confirm Payment"}
          </Button>
        </div>
      }
    >
      <div className="payment-confirm">
        <div className="payment-confirm__info">
          <div className="payment-confirm__row">
            <span className="payment-confirm__label">Order</span>
            <span className="payment-confirm__value">#{orderNumber}</span>
          </div>
          <div className="payment-confirm__row">
            <span className="payment-confirm__label">Total</span>
            <span className="payment-confirm__total">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>

        <div className="payment-confirm__method">
          <span className="payment-confirm__method-label">Payment method</span>
          <div className="payment-confirm__method-options">
            {PAYMENT_METHODS.map((pm) => (
              <label
                key={pm.value}
                className={`payment-confirm__method-option ${
                  method === pm.value
                    ? "payment-confirm__method-option--selected"
                    : ""
                }`}
              >
                <input
                  type="radio"
                  name="payment-method"
                  value={pm.value}
                  checked={method === pm.value}
                  onChange={() => setMethod(pm.value)}
                  disabled={isProcessing}
                />
                <span>{pm.label}</span>
              </label>
            ))}
          </div>
        </div>

        {error && <p className="payment-confirm__error">{error}</p>}
      </div>
    </Modal>
  );
}
