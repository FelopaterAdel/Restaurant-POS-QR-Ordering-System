import type { Pagination } from "@/types/pagination";
import type { PaymentMethod, PaymentStatus } from "@/components/ui";

export interface PaymentHistoryItem {
  id: string;
  orderNumber: number;
  tableNumber: number;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: string | null;
}

export interface PaginatedPaymentHistory {
  data: PaymentHistoryItem[];
  pagination: Pagination;
}

export interface PaymentSummary {
  totalSales: number;
  paidCount: number;
}

export interface PaymentHistoryParams {
  from?: string;
  to?: string;
  orderNumber?: number;
  page?: number;
  limit?: number;
}

export type PaymentSummaryParams = Pick<
  PaymentHistoryParams,
  "from" | "to" | "orderNumber"
>;

export type PaymentDatePreset = "today" | "yesterday" | "week" | "custom";

export interface PaymentDateRange {
  from?: string;
  to?: string;
}
