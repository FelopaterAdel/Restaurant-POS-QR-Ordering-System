import { describe, expect, it } from "vitest";
import authRouter from "../routes/auth.routes.js";

function routePaths(router: { stack: unknown[] }): string[] {
  return router.stack
    .map((layer) => {
      const route = (layer as { route?: { path: string } }).route;
      return route?.path;
    })
    .filter((path): path is string => path !== undefined);
}

describe("auth routes", () => {
  it("exposes the owner bootstrap endpoint", () => {
    expect(routePaths(authRouter)).toContain("/bootstrap/owner");
  });

  it("no longer exposes a public /register endpoint", () => {
    expect(routePaths(authRouter)).not.toContain("/register");
  });

  it("rate-limits login and refresh", () => {
    const loginLayer = authRouter.stack.find(
      (layer) => (layer as { route?: { path: string } }).route?.path === "/login",
    ) as { route: { stack: unknown[] } };

    const refreshLayer = authRouter.stack.find(
      (layer) =>
        (layer as { route?: { path: string } }).route?.path === "/refresh",
    ) as { route: { stack: unknown[] } };

    expect(loginLayer.route.stack.length).toBe(3);
    expect(refreshLayer.route.stack.length).toBe(3);
  });
});
