import express from "express";
import type { NextFunction, Request, Response } from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { errorHandler } from "../errors/http-error-handler.js";
import { sendPaginated, sendSuccess } from "../http/response.js";
import publicMenuRouter from "../modules/public-menu/routes/public-menu.routes.js";

function buildApp() {
  const app = express();
  app.use(express.json());

  app.get("/test/success", (_req, res) => {
    sendSuccess(res, { id: "order_1" }, 201);
  });

  app.get("/test/paginated", (_req, res) => {
    sendPaginated(
      res,
      [{ id: "a" }],
      { page: 2, limit: 10, total: 25, totalPages: 3 },
    );
  });

  app.get("/test/throw", (_req, _res, next) => {
    next(new Error("boom"));
  });

  app.use("/api/v1/public/tables", publicMenuRouter);
  app.use(errorHandler as never);

  return app;
}

describe("API response contract", () => {
  const app = buildApp();

  it("returns success responses with data", async () => {
    const res = await request(app).get("/test/success");

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      success: true,
      data: { id: "order_1" },
    });
  });

  it("returns paginated success responses with a pagination envelope", async () => {
    const res = await request(app).get("/test/paginated");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: [{ id: "a" }],
      pagination: { page: 2, limit: 10, total: 25, totalPages: 3 },
    });
  });

  it("returns 400 VALIDATION_ERROR for an invalid qrCode param", async () => {
    const res = await request(app).get(
      "/api/v1/public/tables/%20/menu",
    );

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details).toEqual([
      expect.objectContaining({ field: "qrCode" }),
    ]);
  });

  it("returns 404 TABLE_NOT_FOUND for an unknown qrCode", async () => {
    const res = await request(app).get(
      "/api/v1/public/tables/tbl_does-not-exist/menu",
    );

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: "TABLE_NOT_FOUND",
        message: "Table not found",
      },
    });
  });

  it("masks unknown errors as 500 INTERNAL_SERVER_ERROR", async () => {
    const res = await request(app).get("/test/throw");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      },
    });
  });
});
