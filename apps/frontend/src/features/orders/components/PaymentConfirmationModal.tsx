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

const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string; icon: string; hint: string }> = [
  { value: "CASH", label: "Cash", icon: "💵", hint: "Notes & coins" },
  { value: "CARD", label: "Card", icon: "💳", hint: "Debit / credit" },
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
            {isProcessing ? <Spinner /> : `Confirm Payment · ${formatCurrency(charge)}`}
          </Button>
        </div>
      }
    >
      <div className="payment-confirm">
        <div className="payment-confirm__hero">
          <div className="payment-confirm__hero-top">
            <span className="payment-confirm__order-chip">Order #{orderNumber}</span>
            <span className="payment-confirm__method-chip">{method === "CASH" ? "💵 Cash" : "💳 Card"}</span>
          </div>
          <div className="payment-confirm__hero-amount-wrap">
            <span className="payment-confirm__hero-label">Remaining to collect</span>
            <span className="payment-confirm__hero-amount">
              {formatCurrency(remaining)}
            </span>
          </div>
          <div className="payment-confirm__hero-rows">
            <div className="payment-confirm__row">
              <span className="payment-confirm__label">Order</span>
              <span className="payment-confirm__value">#{orderNumber}</span>
            </div>
            <div className="payment-confirm__row">
              <span className="payment-confirm__label">Total</span>
              <span className="payment-confirm__value">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>
        </div>

        <div className="payment-confirm__section">
          <span className="payment-confirm__section-title">Payment method</span>
          <div className="payment-confirm__method">
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
                  <span className="payment-confirm__method-icon" aria-hidden="true">{pm.icon}</span>
                  <span className="payment-confirm__method-text">
                    <span className="payment-confirm__method-name">{pm.label}</span>
                    <span className="payment-confirm__method-hint">{pm.hint}</span>
                  </span>
                  <span className="payment-confirm__method-check" aria-hidden="true">✓</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="payment-confirm__section">
          <span className="payment-confirm__section-title">Amount & split</span>
          <div className="payment-confirm__split">
            <div className="payment-confirm__field">
              <label className="payment-confirm__field-label" htmlFor="payment-amount">Amount (items)</label>
              <input
                id="payment-amount"
                className="payment-confirm__input"
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isProcessing}
              />
            </div>
            <div className="payment-confirm__field">
              <label className="payment-confirm__field-label" htmlFor="payment-split">Split evenly into</label>
              <div className="payment-confirm__split-row">
                <input
                  id="payment-split"
                  className="payment-confirm__input"
                  type="number"
                  min={2}
                  step={1}
                  inputMode="numeric"
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
            </div>
          </div>
        </div>

        <div className="payment-confirm__section">
          <span className="payment-confirm__section-title">Tip <span className="payment-confirm__optional">optional</span></span>
          <div className="payment-confirm__tip">
            <div
              className="payment-confirm__tip-pills"
              role="group"
              aria-label="Tip percent"
            >
              {TIP_PRESETS.map((preset) => (
                <label
                  key={preset}
                  className={`payment-confirm__tip-pill${tipPercent === preset ? " payment-confirm__tip-pill--selected" : ""}`}
                >
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
            <div className="payment-confirm__field">
              <label className="payment-confirm__field-label" htmlFor="payment-tip-fixed">Or fixed tip</label>
              <input
                id="payment-tip-fixed"
                className="payment-confirm__input"
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                placeholder="0"
                value={tipFixed}
                onChange={(e) => {
                  setTipFixed(e.target.value);
                  setTipPercent(null);
                }}
                disabled={isProcessing}
              />
            </div>
          </div>
        </div>

        <div className="payment-confirm__charge">
          <div>
            <span className="payment-confirm__charge-label">Total charge</span>
            <span className="payment-confirm__charge-sub">
              {formatCurrency(parsedAmount)} + {formatCurrency(parsedTip)} tip
            </span>
          </div>
          <span className="payment-confirm__total">
            {formatCurrency(charge)}
          </span>
        </div>

        {error && <p className="payment-confirm__error" role="alert">{error}</p>}
      </div>
    </Modal>
  );
}
