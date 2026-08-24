import { describe, expect, it } from "vitest";
import { ADMIN_NAVIGATION, getVisibleNavigation } from "./navigation";

describe("admin navigation", () => {
  it("declares the expected sections in order", () => {
    expect(ADMIN_NAVIGATION.map((item) => item.label)).toEqual([
      "Dashboard",
      "Orders",
      "Kitchen",
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
      "/kds",
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
      "/kds",
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

  it("hides the kitchen display from WAITER", () => {
    expect(getVisibleNavigation({ role: "WAITER" }).map((item) => item.path)).toEqual([
      "/orders",
    ]);
  });

  it("shows Orders and the kitchen display to KITCHEN", () => {
    expect(getVisibleNavigation({ role: "KITCHEN" }).map((item) => item.path)).toEqual([
      "/orders",
      "/kds",
    ]);
  });

  it("returns an empty list without a user", () => {
    expect(getVisibleNavigation(null)).toEqual([]);
  });
});
