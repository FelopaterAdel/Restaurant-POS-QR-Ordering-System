import { ApiError, getApiErrorMessage } from "@/lib/api";

const PAYMENT_ERROR_MESSAGES: Record<string, string> = {
  PAYMENT_ALREADY_EXISTS: "This order has already been paid.",
  PAYMENT_NOT_ALLOWED: "This order can't be paid in its current status.",
  ORDER_NOT_FOUND: "This order no longer exists.",
  FORBIDDEN: "You don't have permission to record payments.",
};

const COMPLETE_ERROR_MESSAGES: Record<string, string> = {
  ORDER_ALREADY_COMPLETED: "This order has already been completed.",
  ORDER_ALREADY_CANCELLED: "This order was cancelled.",
  ORDER_NOT_PAID: "This order must be paid before it can be completed.",
  ORDER_CANNOT_BE_COMPLETED: "This order can't be completed right now.",
  ORDER_NOT_FOUND: "This order no longer exists.",
  FORBIDDEN: "You don't have permission to complete orders.",
};

function mapErrorCode(error: unknown, messages: Record<string, string>): string | null {
  if (error instanceof ApiError) {
    const message = messages[error.code];
    if (message) {
      return message;
    }
  }
  return null;
}

export function getPaymentErrorMessage(error: unknown): string {
  return (
    mapErrorCode(error, PAYMENT_ERROR_MESSAGES) ??
    getApiErrorMessage(error) ??
    "Payment failed. Please try again."
  );
}

export function getCompleteOrderErrorMessage(error: unknown): string {
  return (
    mapErrorCode(error, COMPLETE_ERROR_MESSAGES) ??
    getApiErrorMessage(error) ??
    "Unable to complete this order. Please try again."
  );
}
