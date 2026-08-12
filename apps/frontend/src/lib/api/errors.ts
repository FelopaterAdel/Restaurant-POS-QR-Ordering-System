import axios from "axios";
import type {
  ApiErrorResponse,
  ApiRateLimitResponse,
} from "./types";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function isApiErrorBody(value: unknown): value is ApiErrorResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const body = value as Partial<ApiErrorResponse>;
  return (
    body.success === false &&
    typeof body.error === "object" &&
    body.error !== null &&
    typeof (body.error as { code?: unknown }).code === "string" &&
    typeof (body.error as { message?: unknown }).message === "string"
  );
}

function isRateLimitBody(value: unknown): value is ApiRateLimitResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const body = value as Partial<ApiRateLimitResponse>;
  return body.success === false && typeof body.message === "string";
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const data = error.response?.data;

    if (isApiErrorBody(data)) {
      return new ApiError(
        status,
        data.error.code,
        data.error.message,
        data.error.details,
      );
    }

    if (isRateLimitBody(data)) {
      return new ApiError(status, "RATE_LIMITED", data.message);
    }

    if (status >= 500) {
      return new ApiError(
        status,
        "INTERNAL_SERVER_ERROR",
        "An unexpected error occurred",
      );
    }

    if (error.code === "ECONNABORTED") {
      return new ApiError(0, "NETWORK_TIMEOUT", "The request timed out");
    }

    if (error.code === "ERR_NETWORK") {
      return new ApiError(0, "NETWORK_ERROR", "Unable to reach the server");
    }

    return new ApiError(
      status,
      "NETWORK_ERROR",
      error.message || "Unable to reach the server",
    );
  }

  if (error instanceof Error) {
    return new ApiError(0, "UNKNOWN_ERROR", error.message);
  }

  return new ApiError(0, "UNKNOWN_ERROR", "An unexpected error occurred");
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred";
}
