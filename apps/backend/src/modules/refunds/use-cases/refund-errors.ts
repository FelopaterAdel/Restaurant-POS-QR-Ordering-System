import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../../../errors/app-error.js";
import { AppErrorCode } from "../../../errors/codes.js";

export class RefundNotFoundError extends NotFoundError {
  constructor() {
    super(AppErrorCode.REFUND_NOT_FOUND, "Refund not found");
    this.name = "RefundNotFoundError";
  }
}

export class RefundPaymentMissingError extends NotFoundError {
  constructor() {
    super(AppErrorCode.PAYMENT_NOT_FOUND, "Payment not found");
    this.name = "RefundPaymentMissingError";
  }
}

export class RefundAlreadyPendingError extends ConflictError {
  constructor() {
    super(
      AppErrorCode.REFUND_ALREADY_PENDING,
      "A pending refund already exists for this payment",
    );
    this.name = "RefundAlreadyPendingError";
  }
}

export class RefundInvalidStatusError extends ConflictError {
  constructor(message = "Refund is no longer pending review") {
    super(AppErrorCode.REFUND_INVALID_STATUS, message);
    this.name = "RefundInvalidStatusError";
  }
}

export class RefundInvalidAmountError extends BadRequestError {
  constructor(message = "Refund amount is invalid") {
    super(AppErrorCode.REFUND_INVALID_AMOUNT, message);
    this.name = "RefundInvalidAmountError";
  }
}

export class RefundPaymentNotPaidError extends ConflictError {
  constructor() {
    super(
      AppErrorCode.PAYMENT_NOT_ALLOWED,
      "Only paid payments can be refunded",
    );
    this.name = "RefundPaymentNotPaidError";
  }
}
