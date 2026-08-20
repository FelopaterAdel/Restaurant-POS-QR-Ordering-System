import { describe, expect, it } from "vitest";
import { ADMIN_NAVIGATION, getVisibleNavigation } from "./navigation";

describe("admin navigation", () => {
  it("declares the expected sections in order", () => {
    expect(ADMIN_NAVIGATION.map((item) => item.label)).toEqual([
      "Dashboard",
      "Orders",
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
    ).toEqual(["/dashboard", "/orders", "/tables", "/products", "/categories", "/settings"]);
  });

  it("limits CASHIER, WAITER, and KITCHEN to Orders", () => {
    for (const role of ["CASHIER", "WAITER", "KITCHEN"] as const) {
      expect(getVisibleNavigation({ role }).map((item) => item.path)).toEqual([
        "/orders",
      ]);
    }
  });

  it("returns an empty list without a user", () => {
    expect(getVisibleNavigation(null)).toEqual([]);
  });
});
