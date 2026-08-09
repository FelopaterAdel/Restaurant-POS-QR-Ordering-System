import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { UserRole, UserStatus } from "@restaurant/database";
import type { JWTService } from "../infra/auth/jwt.service.js";
import type { UserRepository } from "../modules/users/repositories/user.repository.js";
import { authMiddleware } from "./auth.middleware.js";
import { buildUser } from "../modules/users/tests/user.fixture.js";

function createMocks() {
  const req = {
    headers: {},
  } as Request;

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as Response;

  const next = vi.fn() as unknown as NextFunction;

  return { req, res, next };
}

function createMiddleware(options: {
  decoded?: { sub?: string; role: UserRole } | null;
  user?: ReturnType<typeof buildUser> | null;
}) {
  const jwtService = {
    verifyAccessToken: vi.fn().mockReturnValue(options.decoded ?? null),
  } as unknown as JWTService;

  const userRepository = {
    findById: vi.fn().mockResolvedValue(options.user ?? null),
  } as unknown as UserRepository;

  const middleware = authMiddleware({ jwtService, userRepository });

  return { middleware, jwtService, userRepository };
}

describe("authMiddleware", () => {
  it("sets req.user and calls next for a valid token", async () => {
    const { req, res, next } = createMocks();
    req.headers.authorization = "Bearer valid-token";
    const user = buildUser();
    const { middleware } = createMiddleware({
      decoded: { sub: user.id, role: UserRole.CASHIER },
      user,
    });

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toEqual({
      id: user.id,
      name: user.name,
      email: user.email,
      role: UserRole.CASHIER,
      status: UserStatus.ACTIVE,
    });
  });

  it("returns 401 when no access token is provided", async () => {
    const { req, res, next } = createMocks();
    const { middleware } = createMiddleware({ decoded: null, user: null });

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 for an invalid or expired token", async () => {
    const { req, res, next } = createMocks();
    req.headers.authorization = "Bearer invalid-token";
    const { middleware } = createMiddleware({ decoded: null, user: null });

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false }),
    );
  });

  it("returns 401 when the token has no subject", async () => {
    const { req, res, next } = createMocks();
    req.headers.authorization = "Bearer no-sub-token";
    const { middleware } = createMiddleware({
      decoded: { role: UserRole.OWNER },
      user: null,
    });

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 401 when the user no longer exists", async () => {
    const { req, res, next } = createMocks();
    req.headers.authorization = "Bearer valid-token";
    const { middleware } = createMiddleware({
      decoded: { sub: "missing", role: UserRole.CASHIER },
      user: null,
    });

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 401 when the account is not active", async () => {
    const { req, res, next } = createMocks();
    req.headers.authorization = "Bearer valid-token";
    const user = buildUser({ status: UserStatus.INACTIVE });
    const { middleware } = createMiddleware({
      decoded: { sub: user.id, role: UserRole.CASHIER },
      user,
    });

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
