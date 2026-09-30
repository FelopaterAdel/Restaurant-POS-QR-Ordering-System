export type RefundStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Refund {
  id: string;
  paymentId: string;
  orderId: string;
  amount: number | string;
  reason: string | null;
  status: RefundStatus;
  requestedBy: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  payment?: {
    id: string;
    orderId: string;
    amount: number | string;
    method: string;
    status: string;
  };
  order?: {
    id: string;
    orderNumber: number;
    totalAmount: number | string;
  };
}

export interface RequestRefundInput {
  paymentId: string;
  amount?: number;
  reason?: string | null;
}
