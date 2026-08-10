import { UserRole, prisma } from "@restaurant/database";
import type { SignOptions } from "jsonwebtoken";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { env } from "../../../config/env.js";
import { JWTService } from "../../../infra/auth/jwt.service.js";
import {
  api,
  createUserDirect,
  dbAvailable,
  loginAs,
  RUN_ID,
  TEST_PASSWORD,
  TestData,
} from "./test-utils.js";

const td = new TestData();
let activeUserEmail: string;
let activeUserToken: string;

const describeAuth = describe.skipIf(!dbAvailable);

describeAuth("auth flows (HTTP)", () => {
  beforeAll(async () => {
    const user = await createUserDirect(td, {
      name: "Active Cashier",
      role: UserRole.CASHIER,
    });
    activeUserEmail = user.email;
  });

  afterAll(async () => {
    await td.cleanup();
  });

  describe("bootstrap owner", () => {
    it("creates the first owner when no owner exists", async () => {
      const ownerCount = await prisma.user.count({
        where: { role: UserRole.OWNER },
      });
      if (ownerCount > 0) {
        return;
      }

      const email = `owner_${RUN_ID}_${Math.random()
        .toString(36)
        .slice(2)}@example.com`;
      const res = await api
        .post("/api/v1/auth/bootstrap/owner")
        .send({ name: "First Owner", email, password: TEST_PASSWORD });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        email: email.toLowerCase(),
        role: UserRole.OWNER,
      });
      td.userIds.push(res.body.data.id);
    });

    it("rejects any further bootstrap attempt with OWNER_ALREADY_EXISTS", async () => {
      const email = `owner_${RUN_ID}_${Math.random()
        .toString(36)
        .slice(2)}@example.com`;
      const first = await api
        .post("/api/v1/auth/bootstrap/owner")
        .send({ name: "Bootstrap Owner", email, password: TEST_PASSWORD });
      expect([201, 409]).toContain(first.status);
      if (first.status === 201) {
        td.userIds.push(first.body.data.id);
      }

      const second = await api
        .post("/api/v1/auth/bootstrap/owner")
        .send({
          name: "Bootstrap Owner 2",
          email: `second_${RUN_ID}_${Math.random()
            .toString(36)
            .slice(2)}@example.com`,
          password: TEST_PASSWORD,
        });
      expect(second.status).toBe(409);
      expect(second.body.success).toBe(false);
      expect(second.body.error.code).toBe("OWNER_ALREADY_EXISTS");
    });
  });

  describe("login", () => {
    it("returns an access token and a refresh token for valid credentials", async () => {
      const res = await loginAs(activeUserEmail);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.data.accessToken).toBe("string");
      expect(typeof res.body.data.refreshToken).toBe("string");
      expect(res.body.data.user.email).toBe(activeUserEmail);
      activeUserToken = res.body.data.accessToken;
    });

    it("rejects a wrong password with INVALID_CREDENTIALS", async () => {
      const res = await loginAs(activeUserEmail, "WrongPassword123!");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("rejects an unknown email with INVALID_CREDENTIALS", async () => {
      const res = await loginAs(`nobody_${RUN_ID}@example.com`);
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("rejects an inactive account with ACCOUNT_NOT_ACTIVE", async () => {
      const inactive = await createUserDirect(td, { status: "INACTIVE" });
      const res = await loginAs(inactive.email);
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("ACCOUNT_NOT_ACTIVE");
    });
  });

  describe("refresh token rotation and revocation", () => {
    it("rotates the refresh token on every use and rejects reuse", async () => {
      const login = await loginAs(activeUserEmail);
      const tokenA = login.body.data.refreshToken as string;

      const first = await api
        .post("/api/v1/auth/refresh")
        .send({ refreshToken: tokenA });
      expect(first.status).toBe(200);
      expect(typeof first.body.data.accessToken).toBe("string");
      const tokenB = first.body.data.refreshToken as string;
      expect(tokenB).toBeDefined();
      expect(tokenB).not.toBe(tokenA);

      const reuse = await api
        .post("/api/v1/auth/refresh")
        .send({ refreshToken: tokenA });
      expect(reuse.status).toBe(401);
      expect(reuse.body.error.code).toBe("INVALID_REFRESH_TOKEN");

      const second = await api
        .post("/api/v1/auth/refresh")
        .send({ refreshToken: tokenB });
      expect(second.status).toBe(200);
    });

    it("rejects a revoked refresh token after logout", async () => {
      const login = await loginAs(activeUserEmail);
      const token = login.body.data.refreshToken as string;

      const logout = await api
        .post("/api/v1/auth/logout")
        .send({ refreshToken: token });
      expect(logout.status).toBe(200);

      const res = await api
        .post("/api/v1/auth/refresh")
        .send({ refreshToken: token });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_REFRESH_TOKEN");
    });

    it("rejects a malformed refresh token", async () => {
      const res = await api
        .post("/api/v1/auth/refresh")
        .send({ refreshToken: "not-a-jwt" });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_REFRESH_TOKEN");
    });

    it("rejects an expired refresh token", async () => {
      const jwtService = new JWTService(
        env.jwt.accessSecret,
        env.jwt.refreshSecret,
        env.jwt.accessExpiresIn,
        "-1s" as SignOptions["expiresIn"],
      );
      const expired = jwtService.generateRefreshToken({
        sub: "any",
        role: UserRole.CASHIER,
      });
      const res = await api
        .post("/api/v1/auth/refresh")
        .send({ refreshToken: expired });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_REFRESH_TOKEN");
    });
  });

  describe("authenticated endpoints", () => {
    it("rejects a request without a token", async () => {
      const res = await api.get("/api/v1/auth/me");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("AUTHENTICATION_REQUIRED");
    });

    it("rejects a malformed access token", async () => {
      const res = await api
        .get("/api/v1/auth/me")
        .set("Authorization", "Bearer not-a-jwt");
      expect(res.status).toBe(401);
    });

    it("rejects an expired access token", async () => {
      const jwtService = new JWTService(
        env.jwt.accessSecret,
        env.jwt.refreshSecret,
        "-1s" as SignOptions["expiresIn"],
        env.jwt.refreshExpiresIn,
      );
      const expired = jwtService.generateAccessToken({
        sub: "any",
        role: UserRole.CASHIER,
      });
      const res = await api
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${expired}`);
      expect(res.status).toBe(401);
    });

    it("accepts a valid token and returns the profile", async () => {
      const res = await api
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${activeUserToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(activeUserEmail);
    });
  });
});
