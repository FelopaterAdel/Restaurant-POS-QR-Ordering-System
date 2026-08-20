import { useCallback } from "react";
import { Button, Modal, Spinner } from "@/components/ui";

export interface CompleteConfirmationModalProps {
  open: boolean;
  orderNumber: number;
  tableNumber: number;
  onClose: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
  error: string | null;
}

export function CompleteConfirmationModal({
  open,
  orderNumber,
  tableNumber,
  onClose,
  onConfirm,
  isProcessing,
  error,
}: CompleteConfirmationModalProps) {
  const handleConfirm = useCallback(() => {
    onConfirm();
  }, [onConfirm]);

  return (
    <Modal
      open={open}
      title="Complete Order"
      onClose={isProcessing ? () => {} : onClose}
      footer={
        <div className="complete-confirm__actions">
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
            {isProcessing ? <Spinner /> : "Complete Order"}
          </Button>
        </div>
      }
    >
      <div className="complete-confirm">
        <div className="complete-confirm__info">
          <div className="complete-confirm__row">
            <span className="complete-confirm__label">Order</span>
            <span className="complete-confirm__value">#{orderNumber}</span>
          </div>
          <div className="complete-confirm__row">
            <span className="complete-confirm__label">Table</span>
            <span className="complete-confirm__value">{tableNumber}</span>
          </div>
          <div className="complete-confirm__row">
            <span className="complete-confirm__label">Payment</span>
            <span className="complete-confirm__value complete-confirm__value--paid">
              PAID ✓
            </span>
          </div>
        </div>

        <p className="complete-confirm__message">Complete this order?</p>

        {error && <p className="complete-confirm__error">{error}</p>}
      </div>
    </Modal>
  );
}
