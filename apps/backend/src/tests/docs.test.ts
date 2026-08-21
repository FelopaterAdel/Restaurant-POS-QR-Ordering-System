import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import app from "../app.js";
import { openapiSpec } from "../docs/openapi.js";

const publicPaths = new Set([
  "/api/v1/health",
  "/api/v1/auth/bootstrap/owner",
  "/api/v1/auth/login",
  "/api/v1/auth/refresh",
  "/api/v1/auth/logout",
  "/api/v1/public/tables/{qrCode}/menu",
  "/api/v1/public/orders",
]);

const expectedOperations: Record<string, string[]> = {
  "/api/v1/health": ["get"],
  "/api/v1/auth/bootstrap/owner": ["post"],
  "/api/v1/auth/login": ["post"],
  "/api/v1/auth/refresh": ["post"],
  "/api/v1/auth/logout": ["post"],
  "/api/v1/auth/me": ["get"],
  "/api/v1/users": ["post", "get"],
  "/api/v1/users/{id}": ["patch", "delete"],
  "/api/v1/users/{id}/status": ["patch"],
  "/api/v1/categories": ["get", "post"],
  "/api/v1/categories/{id}": ["get", "patch", "delete"],
  "/api/v1/products": ["get", "post"],
  "/api/v1/products/{id}": ["get", "patch", "delete"],
  "/api/v1/tables": ["get", "post"],
  "/api/v1/tables/{id}": ["get", "patch", "delete"],
  "/api/v1/tables/{id}/qr": ["get"],
  "/api/v1/tables/{id}/enable": ["post"],
  "/api/v1/dashboard/summary": ["get"],
  "/api/v1/orders": ["get"],
  "/api/v1/orders/{id}": ["get"],
  "/api/v1/orders/{id}/status": ["patch"],
  "/api/v1/orders/{id}/complete": ["post"],
  "/api/v1/orders/{id}/cancel": ["patch"],
  "/api/v1/orders/{orderId}/payment": ["post"],
  "/api/v1/orders/queue": ["get"],
  "/api/v1/orders/history": ["get"],
  "/api/v1/staff/orders/{orderId}": ["get"],
  "/api/v1/public/tables/{qrCode}/menu": ["get"],
  "/api/v1/public/orders": ["post"],
};

const paths = openapiSpec.paths as Record<string, Record<string, unknown>>;
const schemas = (openapiSpec.components as { schemas: Record<string, unknown> })
  .schemas;
const securitySchemes = (
  openapiSpec.components as {
    securitySchemes: Record<string, unknown>;
  }
).securitySchemes;

function operationsOf(path: string): Array<Record<string, unknown>> {
  return Object.entries(paths[path])
    .filter(([key]) => ["get", "post", "patch", "delete", "put"].includes(key))
    .map(([, operation]) => operation as Record<string, unknown>);
}

describe("OpenAPI specification", () => {
  it("is a valid OpenAPI 3.0 document with metadata", () => {
    expect(openapiSpec.openapi).toBe("3.0.3");
    expect(openapiSpec.info.title).toBe("Restaurant POS API");
    expect(openapiSpec.info.version).toBe("1.0.0");
    expect(securitySchemes.bearerAuth).toEqual({
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    });
  });

  it("documents every actual API endpoint with its methods", () => {
    const documentedPaths = new Set(Object.keys(paths));
    const expectedPaths = new Set(Object.keys(expectedOperations));

    expect(documentedPaths).toEqual(expectedPaths);

    for (const [path, methods] of Object.entries(expectedOperations)) {
      const operations = Object.keys(paths[path]).filter((key) =>
        ["get", "post", "patch", "delete", "put"].includes(key),
      );
      expect([...operations].sort()).toEqual([...methods].sort());
    }
  });

  it("requires bearer auth on every protected endpoint and none on public ones", () => {
    for (const path of Object.keys(paths)) {
      const operations = operationsOf(path);

      for (const operation of operations) {
        if (publicPaths.has(path)) {
          expect(operation.security).toBeUndefined();
        } else {
          expect(operation.security).toEqual([{ bearerAuth: [] }]);
        }
      }
    }
  });

  it("defines reusable schemas referenced by the responses", () => {
    expect(schemas.ApiError).toBeDefined();
    expect(schemas.Pagination).toBeDefined();
    expect(schemas.Order).toBeDefined();
  });

  it("has no dangling $refs", () => {
    const refs: string[] = [];

    const walk = (value: unknown) => {
      if (Array.isArray(value)) {
        value.forEach(walk);
      } else if (value !== null && typeof value === "object") {
        const record = value as Record<string, unknown>;
        if (typeof record["$ref"] === "string") {
          refs.push(record["$ref"]);
        }
        for (const entry of Object.values(record)) {
          walk(entry);
        }
      }
    };

    walk(openapiSpec);

    const componentRefs = [
      Object.keys(schemas).map((name) => `#/components/schemas/${name}`),
      Object.keys(
        (openapiSpec.components as { responses: Record<string, unknown> })
          .responses,
      ).map((name) => `#/components/responses/${name}`),
      Object.keys(
        (openapiSpec.components as { parameters: Record<string, unknown> })
          .parameters,
      ).map((name) => `#/components/parameters/${name}`),
    ].flat();

    const knownRefs = new Set(componentRefs);

    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) {
      expect(knownRefs.has(ref)).toBe(true);
    }
  });
});

describe("docs endpoints", () => {
  it("serves the Swagger UI at /api/docs", async () => {
    const res = await request(app).get("/api/docs");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/html");
    expect(res.text).toContain("swagger-ui");
  });

  it("serves the OpenAPI document at /api/docs/openapi.json", async () => {
    const res = await request(app).get("/api/docs/openapi.json");

    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe("3.0.3");
    expect(res.body.paths).toBeDefined();
  });

  it("serves Swagger UI static assets", async () => {
    const res = await request(app).get("/api/docs/swagger-ui.css");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/css");
  });

  it("does not mount docs when SWAGGER_ENABLED=false", async () => {
    vi.resetModules();
    process.env.SWAGGER_ENABLED = "false";

    const disabledApp = (await import("../app.js")).default;
    const res = await request(disabledApp).get("/api/docs/openapi.json");

    expect(res.status).toBe(404);
  });
});

afterEach(() => {
  vi.resetModules();
  delete process.env.SWAGGER_ENABLED;
});
