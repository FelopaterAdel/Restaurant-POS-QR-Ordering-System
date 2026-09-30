import { useCallback, useEffect, useState } from "react";
import { Button, Modal, Spinner } from "@/components/ui";
import type { PaymentMethod } from "@/components/ui";
import { formatCurrency } from "@/lib/format";

export interface PaymentConfirmInput {
  method: PaymentMethod;
  amount: number;
  tipPercent?: number;
  tipAmount?: number;
}

export interface PaymentConfirmationModalProps {
  open: boolean;
  orderNumber: number;
  totalAmount: number;
  remainingAmount?: number;
  onClose: () => void;
  onConfirm: (input: PaymentConfirmInput) => void;
  isProcessing: boolean;
  error: string | null;
}

const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string }> = [
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
];

const TIP_PRESETS = [0, 5, 10, 15];

function toNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function PaymentConfirmationModal({
  open,
  orderNumber,
  totalAmount,
  remainingAmount,
  onClose,
  onConfirm,
  isProcessing,
  error,
}: PaymentConfirmationModalProps) {
  const remaining = remainingAmount ?? totalAmount;
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [amount, setAmount] = useState("");
  const [tipPercent, setTipPercent] = useState<number | null>(null);
  const [tipFixed, setTipFixed] = useState("");
  const [splitParts, setSplitParts] = useState("");

  useEffect(() => {
    if (open) {
      setAmount(String(remaining));
      setTipPercent(null);
      setTipFixed("");
      setSplitParts("");
    }
  }, [open, remaining]);

  const parsedAmount = toNumber(amount) ?? 0;
  const parsedTip =
    tipPercent !== null
      ? (parsedAmount * tipPercent) / 100
      : (toNumber(tipFixed) ?? 0);
  const charge = parsedAmount + parsedTip;

  const handleConfirm = useCallback(() => {
    onConfirm({
      method,
      amount: parsedAmount,
      ...(tipPercent !== null ? { tipPercent } : {}),
      ...(tipPercent === null && tipFixed.trim() !== ""
        ? { tipAmount: Number(tipFixed) }
        : {}),
    });
  }, [onConfirm, method, parsedAmount, tipPercent, tipFixed]);

  const handleSplit = useCallback(() => {
    const parts = Number(splitParts);
    if (Number.isInteger(parts) && parts > 0) {
      setAmount((remaining / parts).toFixed(2));
    }
  }, [remaining, splitParts]);

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
          <div className="payment-confirm__row">
            <span className="payment-confirm__label">Remaining</span>
            <span className="payment-confirm__total">
              {formatCurrency(remaining)}
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

        <div className="payment-confirm__split">
          <label htmlFor="payment-amount">Amount (items)</label>
          <input
            id="payment-amount"
            type="number"
            min={0}
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isProcessing}
          />
          <label htmlFor="payment-split">Split evenly into</label>
          <input
            id="payment-split"
            type="number"
            min={2}
            step={1}
            placeholder="e.g. 2"
            value={splitParts}
            onChange={(e) => setSplitParts(e.target.value)}
            disabled={isProcessing}
          />
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={handleSplit}
            disabled={isProcessing}
          >
            Split
          </Button>
        </div>

        <div className="payment-confirm__tip">
          <span className="payment-confirm__method-label">Tip</span>
          <div
            className="payment-confirm__method-options"
            role="group"
            aria-label="Tip percent"
          >
            {TIP_PRESETS.map((preset) => (
              <label key={preset}>
                <input
                  type="radio"
                  name="tip-percent"
                  value={String(preset)}
                  checked={tipPercent === preset}
                  onChange={() => {
                    setTipPercent(preset);
                    setTipFixed("");
                  }}
                  disabled={isProcessing}
                />
                <span>{preset === 0 ? "No tip" : `${preset}%`}</span>
              </label>
            ))}
          </div>
          <label htmlFor="payment-tip-fixed">Or fixed tip</label>
          <input
            id="payment-tip-fixed"
            type="number"
            min={0}
            step="any"
            placeholder="0"
            value={tipFixed}
            onChange={(e) => {
              setTipFixed(e.target.value);
              setTipPercent(null);
            }}
            disabled={isProcessing}
          />
        </div>

        <div className="payment-confirm__row">
          <span className="payment-confirm__label">Charge</span>
          <span className="payment-confirm__total">
            {formatCurrency(charge)}
          </span>
        </div>

        {error && <p className="payment-confirm__error">{error}</p>}
      </div>
    </Modal>
  );
}
