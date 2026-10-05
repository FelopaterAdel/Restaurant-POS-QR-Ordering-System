import { describe, expect, it } from "vitest";
import {
  ADMIN_NAVIGATION,
  getGroupedNavigation,
  getVisibleNavigation,
} from "./navigation";

describe("admin navigation", () => {
  it("declares the expected sections in order", () => {
    expect(ADMIN_NAVIGATION.map((item) => item.label)).toEqual([
      "Dashboard",
      "Analytics",
      "Reports",
      "Orders",
      "Kitchen",
      "Ready Orders",
      "Payments",
      "Tables",
      "Reservations",
      "Products",
      "Categories",
      "Inventory",
      "Coupons",
      "Users",
      "Audit Log",
      "Settings",
    ]);
  });

  it("assigns every item to a group with an icon", () => {
    for (const item of ADMIN_NAVIGATION) {
      expect(item.group, item.label).toBeTruthy();
      expect(item.icon, item.label).toBeTruthy();
    }
  });

  it("shows every section to OWNER", () => {
    expect(
      getVisibleNavigation({ role: "OWNER" }).map((item) => item.path),
    ).toEqual([
      "/dashboard",
      "/analytics",
      "/reports",
      "/orders",
      "/kds",
      "/waiter",
      "/payments",
      "/tables",
      "/reservations",
      "/products",
      "/categories",
      "/inventory",
      "/coupons",
      "/users",
      "/audit-log",
      "/settings",
    ]);
  });

  it("hides Users from MANAGER but shows Settings", () => {
    expect(
      getVisibleNavigation({ role: "MANAGER" }).map((item) => item.path),
    ).toEqual([
      "/dashboard",
      "/analytics",
      "/reports",
      "/orders",
      "/kds",
      "/waiter",
      "/payments",
      "/tables",
      "/reservations",
      "/products",
      "/categories",
      "/inventory",
      "/coupons",
      "/audit-log",
      "/settings",
    ]);
  });

  it("limits CASHIER to reservations, orders and payments", () => {
    expect(getVisibleNavigation({ role: "CASHIER" }).map((item) => item.path)).toEqual([
      "/orders",
      "/payments",
      "/reservations",
    ]);
  });

  it("shows Orders and the ready queue to WAITER, and hides the kitchen display", () => {
    expect(getVisibleNavigation({ role: "WAITER" }).map((item) => item.path)).toEqual([
      "/orders",
      "/waiter",
      "/reservations",
    ]);
  });

  it("shows Orders and the kitchen display to KITCHEN", () => {
    expect(getVisibleNavigation({ role: "KITCHEN" }).map((item) => item.path)).toEqual([
      "/orders",
      "/kds",
    ]);
  });

  it("groups visible navigation without empty sections", () => {
    const grouped = getGroupedNavigation({ role: "OWNER" });
    expect(grouped.length).toBeGreaterThan(0);
    for (const section of grouped) {
      expect(section.items.length).toBeGreaterThan(0);
    }
    expect(grouped.map((s) => s.group)).toContain("Service");
  });

  it("returns an empty list without a user", () => {
    expect(getVisibleNavigation(null)).toEqual([]);
  });
});
