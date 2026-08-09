import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { env } from "../config/env.js";
import authRouter from "../modules/auth/routes/auth.routes.js";

function buildAuthApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/auth", authRouter);
  return app;
}

describe("authentication rate limiting", () => {
  it("returns 429 after exceeding the login attempt limit", async () => {
    const app = buildAuthApp();

    for (let i = 0; i < env.authRateLimit.loginMax; i++) {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "not-an-email" });

      expect(res.status).not.toBe(429);
    }

    const blocked = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "not-an-email" });

    expect(blocked.status).toBe(429);
  });

  it("returns 429 after exceeding the refresh attempt limit", async () => {
    const app = buildAuthApp();

    for (let i = 0; i < env.authRateLimit.refreshMax; i++) {
      const res = await request(app)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken: "" });

      expect(res.status).not.toBe(429);
    }

    const blocked = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: "" });

    expect(blocked.status).toBe(429);
  });
});
