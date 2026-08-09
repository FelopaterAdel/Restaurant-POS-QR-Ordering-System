import { AppErrorCode, type AppErrorCode as AppErrorCodeType } from "./codes.js";

export interface ValidationIssue {
  field: string;
  message: string;
}

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: AppErrorCodeType;
  readonly details?: unknown;

  constructor(
    statusCode: number,
    code: AppErrorCodeType,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(
    message = "Validation failed",
    details: ValidationIssue[] = [],
  ) {
    super(400, AppErrorCode.VALIDATION_ERROR, message, details);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(
    message = "Authentication required",
    code: AppErrorCodeType = AppErrorCode.AUTHENTICATION_REQUIRED,
  ) {
    super(401, code, message);
    this.name = "UnauthorizedError";
  }
}

export class BadRequestError extends AppError {
  constructor(code: AppErrorCodeType, message: string) {
    super(400, code, message);
    this.name = "BadRequestError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(403, AppErrorCode.FORBIDDEN, message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(code: AppErrorCodeType, message: string) {
    super(404, code, message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(code: AppErrorCodeType, message: string) {
    super(409, code, message);
    this.name = "ConflictError";
  }
}
