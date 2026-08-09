import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { UserRole } from "@restaurant/database";
import { requireRole } from "./role.middleware.js";

function createMocks(userRole?: UserRole) {
  const req = {
    user: userRole ? { id: "user_1", role: userRole } : undefined,
  } as Request;

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as Response;

  const next = vi.fn() as unknown as NextFunction;

  return { req, res, next };
}

describe("requireRole", () => {
  it("calls next when the user has an allowed role", () => {
    const { req, res, next } = createMocks(UserRole.OWNER);

    requireRole(UserRole.OWNER, UserRole.MANAGER)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 403 when the user role is not allowed", () => {
    const { req, res, next } = createMocks(UserRole.CASHIER);

    requireRole(UserRole.OWNER)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when the request is not authenticated", () => {
    const { req, res, next } = createMocks();

    requireRole(UserRole.OWNER)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
