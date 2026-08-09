import { z } from "zod";
import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { validate } from "./validate.middleware.js";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

const bodySchema = z.object({
  name: z.string().trim(),
});

function createMocks(query: Record<string, unknown> = {}) {
  // Express 5 exposes req.query as a getter-only property.
  const req = {} as Request;
  Object.defineProperty(req, "query", {
    configurable: true,
    enumerable: true,
    get: () => query,
  });

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as Response;

  const next = vi.fn() as unknown as NextFunction;

  return { req, res, next };
}

describe("validate middleware", () => {
  it("shadows the getter-only req.query with validated, defaulted values", async () => {
    const { req, res, next } = createMocks({});

    await validate(querySchema, "query")(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    expect(req.query).toEqual({ page: 1, limit: 20 });
  });

  it("coerces string query values into typed values", async () => {
    const { req, res, next } = createMocks({ page: "3", limit: "10" });

    await validate(querySchema, "query")(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.query).toEqual({ page: 3, limit: 10 });
  });

  it("returns 400 and does not call next for invalid query data", async () => {
    const { req, res, next } = createMocks({ limit: "500" });

    await validate(querySchema, "query")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        errors: [
          expect.objectContaining({
            field: "limit",
          }),
        ],
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("replaces req.body with validated body data", async () => {
    const { req, res, next } = createMocks();
    req.body = { name: "  hi  " };

    await validate(bodySchema, "body")(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect((req as Request & { body: { name: string } }).body).toEqual({
      name: "hi",
    });
  });
});
