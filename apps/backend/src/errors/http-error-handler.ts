import type { ErrorRequestHandler } from "express";
import { Prisma } from "@restaurant/database";
import { ZodError } from "zod";
import {
  AppError,
  ValidationError,
  type ValidationIssue,
} from "./app-error.js";
import { AppErrorCode } from "./codes.js";

const INTERNAL_MESSAGE = "An unexpected error occurred";

export function errorResponseBody(error: AppError) {
  const body: {
    success: false;
    error: {
      code: string;
      message: string;
      details?: unknown;
    };
  } = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
    },
  };

  if (error.details !== undefined) {
    body.error.details = error.details;
  }

  return body;
}

function toValidationIssues(error: ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    field: issue.path.join(".") || "unknown",
    message: issue.message,
  }));
}

export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  if (error instanceof ZodError) {
    res.status(400).json(
      errorResponseBody(new ValidationError("Validation failed", toValidationIssues(error))),
    );
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json(errorResponseBody(error));
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    console.error(`[prisma] ${error.code}: ${error.message}`);
    res.status(500).json(
      errorResponseBody(
        new AppError(500, AppErrorCode.INTERNAL_SERVER_ERROR, INTERNAL_MESSAGE),
      ),
    );
    return;
  }

  console.error(error);
  res.status(500).json(
    errorResponseBody(
      new AppError(500, AppErrorCode.INTERNAL_SERVER_ERROR, INTERNAL_MESSAGE),
    ),
  );
};
