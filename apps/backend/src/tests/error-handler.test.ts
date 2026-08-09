import { vi, describe, expect, it } from "vitest";
import type { Response } from "express";
import { Prisma } from "@restaurant/database";
import { z, type ZodError } from "zod";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../errors/app-error.js";
import { AppErrorCode } from "../errors/codes.js";
import { errorHandler } from "../errors/http-error-handler.js";

function createRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as Response;
  return res;
}

function invoke(error: unknown) {
  const res = createRes();
  errorHandler(error, {} as never, res, vi.fn() as never);
  return res;
}

describe("errorHandler contract", () => {
  it("shapes 400 validation errors with field details", () => {
    const res = invoke(
      new ValidationError("Validation failed", [
        { field: "name", message: "Required" },
      ]),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: AppErrorCode.VALIDATION_ERROR,
        message: "Validation failed",
        details: [{ field: "name", message: "Required" }],
      },
    });
  });

  it("maps raw ZodError to 400 VALIDATION_ERROR", () => {
    let zodError: ZodError | undefined;
    try {
      z.object({ limit: z.number().max(10, "Too big") }).parse({ limit: 500 });
    } catch (error) {
      zodError = error as ZodError;
    }
    expect(zodError).toBeDefined();
    const res = invoke(zodError!);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: AppErrorCode.VALIDATION_ERROR,
        message: "Validation failed",
        details: [{ field: "limit", message: "Too big" }],
      },
    });
  });

  it("shapes 401 errors", () => {
    const res = invoke(new UnauthorizedError());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: AppErrorCode.AUTHENTICATION_REQUIRED,
        message: "Authentication required",
      },
    });
  });

  it("shapes 403 errors", () => {
    const res = invoke(new ForbiddenError());

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: AppErrorCode.FORBIDDEN,
        message: "You do not have permission to perform this action",
      },
    });
  });

  it("shapes 404 errors", () => {
    const res = invoke(
      new NotFoundError(AppErrorCode.ORDER_NOT_FOUND, "Order not found"),
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: AppErrorCode.ORDER_NOT_FOUND,
        message: "Order not found",
      },
    });
  });

  it("shapes 409 errors", () => {
    const res = invoke(
      new ConflictError(AppErrorCode.EMAIL_ALREADY_EXISTS, "Email already exists"),
    );

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: AppErrorCode.EMAIL_ALREADY_EXISTS,
        message: "Email already exists",
      },
    });
  });

  it("hides details and returns 500 for Prisma errors", () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed",
      { code: "P2002", clientVersion: "1", meta: {} },
    );
    const res = invoke(prismaError);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: AppErrorCode.INTERNAL_SERVER_ERROR,
        message: "An unexpected error occurred",
      },
    });
  });

  it("hides details and returns 500 for unknown errors", () => {
    const res = invoke(new Error("database connection string leaked: secret"));

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: AppErrorCode.INTERNAL_SERVER_ERROR,
        message: "An unexpected error occurred",
      },
    });
  });
});
