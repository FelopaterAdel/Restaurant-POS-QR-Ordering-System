import { describe, expect, it } from "vitest";
import {
  PAGE_PERMISSIONS,
  canAccess,
  canAccessPath,
  getDefaultRoute,
  hasRole,
  resolvePostLoginRedirect,
} from "./permissions";
import type { UserRole } from "./types";

function userOf(role: UserRole) {
  return { role };
}

describe("permissions", () => {
  it("grants OWNER access to every page", () => {
    for (const permission of PAGE_PERMISSIONS) {
      expect(canAccess(userOf("OWNER"), permission)).toBe(true);
    }
  });

  it("matches the matrix for MANAGER", () => {
    expect(canAccess(userOf("MANAGER"), "dashboard")).toBe(true);
    expect(canAccess(userOf("MANAGER"), "products")).toBe(true);
    expect(canAccess(userOf("MANAGER"), "categories")).toBe(true);
    expect(canAccess(userOf("MANAGER"), "tables")).toBe(true);
    expect(canAccess(userOf("MANAGER"), "orders")).toBe(true);
    expect(canAccess(userOf("MANAGER"), "payments")).toBe(true);
    expect(canAccess(userOf("MANAGER"), "users")).toBe(false);
  });

  it("matches the matrix for CASHIER", () => {
    expect(canAccess(userOf("CASHIER"), "orders")).toBe(true);
    expect(canAccess(userOf("CASHIER"), "payments")).toBe(true);
    for (const denied of ["dashboard", "users", "products", "categories", "tables"] as const) {
      expect(canAccess(userOf("CASHIER"), denied)).toBe(false);
    }
  });

  it("matches the matrix for WAITER", () => {
    expect(canAccess(userOf("WAITER"), "orders")).toBe(true);
    expect(canAccess(userOf("WAITER"), "payments")).toBe(false);
    expect(canAccess(userOf("WAITER"), "dashboard")).toBe(false);
    expect(canAccess(userOf("WAITER"), "users")).toBe(false);
  });

  it("matches the matrix for KITCHEN", () => {
    expect(canAccess(userOf("KITCHEN"), "orders")).toBe(true);
    expect(canAccess(userOf("KITCHEN"), "payments")).toBe(false);
    expect(canAccess(userOf("KITCHEN"), "dashboard")).toBe(false);
    expect(canAccess(userOf("KITCHEN"), "users")).toBe(false);
  });

  it("checks membership with hasRole", () => {
    expect(hasRole(userOf("OWNER"), "OWNER")).toBe(true);
    expect(hasRole(userOf("WAITER"), "OWNER")).toBe(false);
    expect(hasRole(userOf("KITCHEN"), ["OWNER", "KITCHEN"])).toBe(true);
    expect(hasRole(userOf("CASHIER"), ["OWNER", "KITCHEN"])).toBe(false);
  });

  it("computes a default route per role", () => {
    expect(getDefaultRoute(userOf("OWNER"))).toBe("/dashboard");
    expect(getDefaultRoute(userOf("MANAGER"))).toBe("/dashboard");
    expect(getDefaultRoute(userOf("CASHIER"))).toBe("/orders");
    expect(getDefaultRoute(userOf("WAITER"))).toBe("/orders");
    expect(getDefaultRoute(userOf("KITCHEN"))).toBe("/orders");
  });

  it("validates access for a path", () => {
    expect(canAccessPath(userOf("CASHIER"), "/orders")).toBe(true);
    expect(canAccessPath(userOf("CASHIER"), "/dashboard")).toBe(false);
    expect(canAccessPath(userOf("OWNER"), "/users")).toBe(true);
    expect(canAccessPath(userOf("OWNER"), "/public/menu/abc")).toBe(false);
    expect(canAccessPath(userOf("OWNER"), "")).toBe(false);
  });

  it("keeps an allowed redirect and falls back otherwise", () => {
    expect(resolvePostLoginRedirect(userOf("OWNER"), "/users")).toBe("/users");
    expect(resolvePostLoginRedirect(userOf("CASHIER"), "/users")).toBe("/orders");
    expect(resolvePostLoginRedirect(userOf("WAITER"), null)).toBe("/orders");
    expect(resolvePostLoginRedirect(userOf("OWNER"), "https://evil.example")).toBe("/dashboard");
    expect(resolvePostLoginRedirect(userOf("OWNER"), "//evil.example")).toBe("/dashboard");
  });
});
