import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("dotenv", () => ({
  config: vi.fn(),
}));

const REQUIRED_VARS = [
  "DATABASE_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
] as const;

async function importEnv() {
  vi.resetModules();
  return import("../../../config/env.js");
}

describe("environment configuration", () => {
  const original = new Map<string, string | undefined>();

  beforeEach(() => {
    original.clear();
    for (const name of REQUIRED_VARS) {
      original.set(name, process.env[name]);
      delete process.env[name];
    }
  });

  afterEach(() => {
    for (const [name, value] of original) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
    vi.unstubAllEnvs();
  });

  it("loads when all required variables are present", async () => {
    vi.stubEnv("DATABASE_URL", "postgres://test");
    vi.stubEnv("JWT_ACCESS_SECRET", "access-secret");
    vi.stubEnv("JWT_REFRESH_SECRET", "refresh-secret");

    const module = await importEnv();
    expect(module.env.jwt.accessSecret).toBe("access-secret");
    expect(module.env.jwt.refreshSecret).toBe("refresh-secret");
  });

  it("fails to load when JWT_ACCESS_SECRET is missing", async () => {
    vi.stubEnv("DATABASE_URL", "postgres://test");
    vi.stubEnv("JWT_REFRESH_SECRET", "refresh-secret");

    await expect(importEnv()).rejects.toThrow(/JWT_ACCESS_SECRET/);
  });

  it("fails to load when JWT_REFRESH_SECRET is missing", async () => {
    vi.stubEnv("DATABASE_URL", "postgres://test");
    vi.stubEnv("JWT_ACCESS_SECRET", "access-secret");

    await expect(importEnv()).rejects.toThrow(/JWT_REFRESH_SECRET/);
  });

  it("fails to load when DATABASE_URL is missing", async () => {
    vi.stubEnv("JWT_ACCESS_SECRET", "access-secret");
    vi.stubEnv("JWT_REFRESH_SECRET", "refresh-secret");

    await expect(importEnv()).rejects.toThrow(/DATABASE_URL/);
  });
});
