import { Badge, type BadgeVariant } from "./badge";
import type { PaymentStatus } from "./order-status";

const PAYMENT_STATUS_VARIANT: Record<PaymentStatus, BadgeVariant> = {
  PENDING: "neutral",
  PAID: "success",
  VOIDED: "danger",
};

const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: "Unpaid",
  PAID: "Paid",
  VOIDED: "Refunded",
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge variant={PAYMENT_STATUS_VARIANT[status]}>
      {PAYMENT_STATUS_LABEL[status]}
    </Badge>
  );
}
