import type { RouteObject } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AdminLayout } from "@/layouts/AdminLayout";
import { AccessDeniedPage } from "@/pages/access-denied/access-denied-page";
import { HomePage } from "@/pages/home/home-page";
import { LoginPage } from "@/pages/login/login-page";
import { NotFoundPage } from "@/pages/not-found/not-found-page";
import { PublicMenuPage } from "@/pages/public-menu/public-menu-page";
import { appRoutes } from "./app-router";
import { GuestRoute } from "./guest-route";
import { ProtectedRoute } from "./protected-route";
import { RoleRoute } from "./role-route";

interface LocatedRoute {
  route: RouteObject;
  parentElement: unknown;
  rootElement: unknown;
}

function locate(routes: RouteObject[], path: string): LocatedRoute | null {
  for (const route of routes) {
    if (route.path === path) {
      return { route, parentElement: null, rootElement: null };
    }
    const found = locateWithin(route, path, route.element ?? null);
    if (found) {
      return found;
    }
  }
  return null;
}

function locateWithin(
  route: RouteObject,
  path: string,
  rootElement: unknown,
): LocatedRoute | null {
  for (const child of route.children ?? []) {
    if (child.path === path) {
      return {
        route: child,
        parentElement: route.element ?? null,
        rootElement,
      };
    }
    const found = locateWithin(child, path, rootElement);
    if (found) {
      return found;
    }
  }
  return null;
}

function collectElementChain(
  routes: RouteObject[],
  path: string,
  chain: unknown[] = [],
): unknown[] | null {
  for (const route of routes) {
    const next = [...chain, route.element ?? null];
    if (route.path === path) {
      return next;
    }
    if (route.children) {
      const found = collectElementChain(route.children, path, next);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

function elementType(element: unknown): unknown {
  if (element && typeof element === "object" && "type" in element) {
    return (element as { type: unknown }).type;
  }
  return null;
}

function rolePermissionOf(element: unknown): string | undefined {
  if (element && typeof element === "object" && "props" in element) {
    return (element as { props?: { permission?: string } }).props?.permission;
  }
  return undefined;
}

describe("app routes", () => {
  it("keeps the home route public", () => {
    const home = locate(appRoutes, "/");
    expect(home?.route.element).not.toBeNull();
    expect(elementType(home?.route.element)).toBe(HomePage);
    expect(home?.parentElement).toBeNull();
  });

  it("wraps /login in a guest-only guard", () => {
    const login = locate(appRoutes, "/login");
    expect(login).not.toBeNull();
    expect(elementType(login?.route.element)).toBe(LoginPage);
    expect(elementType(login?.parentElement)).toBe(GuestRoute);
    expect(elementType(login?.rootElement)).toBe(GuestRoute);
  });

  it("keeps the public menu outside any auth guard", () => {
    const menu = locate(appRoutes, "/public/menu/:qrCode");
    expect(menu).not.toBeNull();
    expect(elementType(menu?.route.element)).toBe(PublicMenuPage);
    expect(menu?.parentElement).toBeNull();
  });

  it("protects every business route with a matching role guard", () => {
    const expectations: Array<[string, string]> = [
      ["/dashboard", "dashboard"],
      ["/orders", "orders"],
      ["/tables", "tables"],
      ["/products", "products"],
      ["/categories", "categories"],
      ["/users", "users"],
      ["/payments", "payments"],
    ];

    for (const [path, permission] of expectations) {
      const found = locate(appRoutes, path);
      expect(found, `route ${path} should exist`).not.toBeNull();
      expect(
        elementType(found?.parentElement),
        `${path} must be role-guarded`,
      ).toBe(RoleRoute);
      expect(
        rolePermissionOf(found?.parentElement),
        `${path} must require ${permission}`,
      ).toBe(permission);
      expect(
        elementType(found?.rootElement),
        `${path} must sit behind ProtectedRoute`,
      ).toBe(ProtectedRoute);
    }
  });

  it("serves /403 inside the protected area", () => {
    const denied = locate(appRoutes, "/403");
    expect(denied).not.toBeNull();
    expect(elementType(denied?.route.element)).toBe(AccessDeniedPage);
    expect(elementType(denied?.rootElement)).toBe(ProtectedRoute);
  });

  it("nests every admin page inside the AdminLayout shell", () => {
    const pages = [
      "/dashboard",
      "/orders",
      "/tables",
      "/products",
      "/categories",
      "/users",
      "/payments",
    ];

    for (const path of pages) {
      const chain = collectElementChain(appRoutes, path);
      expect(chain, `route ${path} should exist`).not.toBeNull();
      expect(chain?.map(elementType)).toContain(AdminLayout);
    }
  });

  it("serves /404 and a catch-all for unknown paths", () => {
    const notFound = locate(appRoutes, "/404");
    expect(notFound).not.toBeNull();
    expect(elementType(notFound?.route.element)).toBe(NotFoundPage);

    const catchAll = locate(appRoutes, "*");
    expect(catchAll).not.toBeNull();
    expect(elementType(catchAll?.route.element)).toBe(NotFoundPage);
  });
});
