import { describe, expect, it } from "vitest";
import { ADMIN_NAVIGATION, getVisibleNavigation } from "./navigation";

describe("admin navigation", () => {
  it("declares the expected sections in order", () => {
    expect(ADMIN_NAVIGATION.map((item) => item.label)).toEqual([
      "Dashboard",
      "Orders",
      "Payments",
      "Tables",
      "Products",
      "Categories",
      "Users",
      "Settings",
    ]);
  });

  it("shows every section to OWNER", () => {
    expect(
      getVisibleNavigation({ role: "OWNER" }).map((item) => item.path),
    ).toEqual([
      "/dashboard",
      "/orders",
      "/payments",
      "/tables",
      "/products",
      "/categories",
      "/users",
      "/settings",
    ]);
  });

  it("hides Users from MANAGER but shows Settings", () => {
    expect(
      getVisibleNavigation({ role: "MANAGER" }).map((item) => item.path),
    ).toEqual([
      "/dashboard",
      "/orders",
      "/payments",
      "/tables",
      "/products",
      "/categories",
      "/settings",
    ]);
  });

  it("limits CASHIER to Orders and Payments", () => {
    expect(getVisibleNavigation({ role: "CASHIER" }).map((item) => item.path)).toEqual([
      "/orders",
      "/payments",
    ]);
  });

  it("hides Payments from WAITER and KITCHEN", () => {
    for (const role of ["WAITER", "KITCHEN"] as const) {
      expect(getVisibleNavigation({ role }).map((item) => item.path)).toEqual([
        "/orders",
      ]);
    }
  });

  it("returns an empty list without a user", () => {
    expect(getVisibleNavigation(null)).toEqual([]);
  });
});
