export type AuditAction =
  | "REFUND_REQUESTED"
  | "REFUND_APPROVED"
  | "REFUND_REJECTED"
  | "PAYMENT_VOIDED"
  | "DISCOUNT_APPLIED"
  | "STOCK_ADJUSTED"
  | "ORDER_CANCELLED";

export interface AuditUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuditEntry {
  id: string;
  action: AuditAction;
  entityType: string | null;
  entityId: string | null;
  details: unknown;
  createdAt: string;
  user: AuditUser | null;
}

export interface AuditLogParams {
  userId?: string;
  action?: AuditAction;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}
