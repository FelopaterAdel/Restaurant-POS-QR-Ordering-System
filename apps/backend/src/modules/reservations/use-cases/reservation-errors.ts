import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../../../errors/app-error.js";
import { AppErrorCode } from "../../../errors/codes.js";

export class ReservationNotFoundError extends NotFoundError {
  constructor() {
    super(AppErrorCode.RESERVATION_NOT_FOUND, "Reservation not found");
    this.name = "ReservationNotFoundError";
  }
}

export class ReservationTableNotFoundError extends NotFoundError {
  constructor() {
    super(AppErrorCode.TABLE_NOT_FOUND, "Table not found");
    this.name = "ReservationTableNotFoundError";
  }
}

export class ReservationTableDisabledError extends ConflictError {
  constructor() {
    super(AppErrorCode.TABLE_DISABLED, "Table is disabled");
    this.name = "ReservationTableDisabledError";
  }
}

export class ReservationInPastError extends BadRequestError {
  constructor() {
    super(
      AppErrorCode.RESERVATION_IN_PAST,
      "Reservation time must be in the future",
    );
    this.name = "ReservationInPastError";
  }
}

export class ReservationConflictError extends ConflictError {
  constructor() {
    super(
      AppErrorCode.RESERVATION_CONFLICT,
      "Table is already reserved around that time",
    );
    this.name = "ReservationConflictError";
  }
}

export class ReservationInvalidStatusError extends ConflictError {
  constructor(from: string, to: string) {
    super(
      AppErrorCode.RESERVATION_INVALID_STATUS,
      `Cannot change reservation status from ${from} to ${to}`,
    );
    this.name = "ReservationInvalidStatusError";
  }
}
