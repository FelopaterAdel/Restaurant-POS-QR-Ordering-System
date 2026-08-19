export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "SERVED",
  "COMPLETED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["PENDING", "PAID", "VOIDED"] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = ["CASH", "CARD"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const QUEUE_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
] as const;

export type QueueStatus = (typeof QUEUE_STATUSES)[number];
