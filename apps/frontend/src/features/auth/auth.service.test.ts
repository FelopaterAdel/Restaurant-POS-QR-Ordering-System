import { AxiosError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient, setSessionExpiredHandler } from "@/lib/api";
import { clearAuthTokens, getAccessToken, getRefreshToken, setAuthTokens } from "@/lib/auth";
import { authService } from "./service";
import type { SafeUser } from "./types";

const testUser: SafeUser = {
  id: "user_1",
  name: "Omar",
  email: "omar@example.com",
  role: "OWNER",
  status: "ACTIVE",
};

interface MockEntry {
  match: (url: string) => boolean;
  status: number;
  data: unknown;
  networkError?: boolean;
}

interface RecordedRequest {
  url: string;
  method?: string;
  authorization: string | null;
}

let responses: MockEntry[] = [];
let requests: RecordedRequest[] = [];

function queueResponse(
  urlPattern: string | RegExp,
  status: number,
  data: unknown,
  networkError = false,
) {
  responses.push({
    match: (url) =>
      typeof urlPattern === "string"
        ? url.includes(urlPattern)
        : urlPattern.test(url),
    status,
    data,
    networkError,
  });
}

function recordedCalls(urlPart: string): RecordedRequest[] {
  return requests.filter((request) => request.url.includes(urlPart));
}

function buildResponse(
  config: InternalAxiosRequestConfig,
  status: number,
  data: unknown,
): Promise<AxiosResponse> {
  const response = {
    data,
    status,
    statusText: "",
    headers: {},
    config,
  } as AxiosResponse;

  if (status >= 200 && status < 300) {
    return Promise.resolve(response);
  }

  return Promise.reject(
    new AxiosError(
      `Request failed with status code ${status}`,
      "ERR_BAD_REQUEST",
      config,
      undefined,
      response,
    ),
  );
}

const mockAdapter: AxiosAdapter = (config) => {
  const url = config.url ?? "";
  const headers = config.headers as unknown as {
    get?: (name: string) => string | undefined;
  };
  requests.push({
    url,
    method: config.method,
    authorization: headers?.get?.("Authorization") ?? null,
  });

  const index = responses.findIndex((entry) => entry.match(url));
  if (index === -1) {
    return buildResponse(config, 404, undefined);
  }
  const [entry] = responses.splice(index, 1);

  if (entry.networkError) {
    return Promise.reject(
      new AxiosError("Network Error", "ERR_NETWORK", config),
    );
  }

  return buildResponse(config, entry.status, entry.data);
};

describe("authService", () => {
  beforeEach(() => {
    responses = [];
    requests = [];
    clearAuthTokens();
    setSessionExpiredHandler(null);
    apiClient.defaults.adapter = mockAdapter;
  });

  it("persists tokens and returns the user on login", async () => {
    queueResponse("/auth/login", 200, {
      success: true,
      data: { user: testUser, accessToken: "at-1", refreshToken: "rt-1" },
    });

    const result = await authService.login({
      email: testUser.email,
      password: "secret",
    });

    expect(result).toEqual(testUser);
    expect(getAccessToken()).toBe("at-1");
    expect(getRefreshToken()).toBe("rt-1");
  });

  it("surfaces the login error without storing tokens or attempting a refresh", async () => {
    setAuthTokens("expired", "rt-1");
    queueResponse("/auth/login", 401, {
      success: false,
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password",
      },
    });

    await expect(
      authService.login({ email: testUser.email, password: "wrong" }),
    ).rejects.toMatchObject({
      status: 401,
      code: "INVALID_CREDENTIALS",
    });

    expect(getAccessToken()).toBe("expired");
    expect(getRefreshToken()).toBe("rt-1");
    expect(recordedCalls("/auth/refresh")).toHaveLength(0);
  });

  it("returns null without a network call when no refresh token exists", async () => {
    const result = await authService.getSessionUser();

    expect(result).toBeNull();
    expect(requests).toHaveLength(0);
  });

  it("returns the current user from /auth/me", async () => {
    setAuthTokens("at-1", "rt-1");
    queueResponse("/auth/me", 200, { success: true, data: testUser });

    const result = await authService.getSessionUser();

    expect(result).toEqual(testUser);
    expect(recordedCalls("/auth/me")[0]?.authorization).toBe("Bearer at-1");
  });

  it("refreshes the access token and retries the request once", async () => {
    setAuthTokens("expired", "rt-1");
    queueResponse("/auth/me", 401, {
      success: false,
      error: { code: "AUTHENTICATION_REQUIRED", message: "Unauthorized" },
    });
    queueResponse("/auth/refresh", 200, {
      success: true,
      data: { accessToken: "at-2", refreshToken: "rt-2" },
    });
    queueResponse("/auth/me", 200, { success: true, data: testUser });

    const result = await authService.getSessionUser();

    expect(result).toEqual(testUser);
    expect(getAccessToken()).toBe("at-2");
    expect(getRefreshToken()).toBe("rt-2");
    expect(recordedCalls("/auth/refresh")).toHaveLength(1);

    const meCalls = recordedCalls("/auth/me");
    expect(meCalls[0]?.authorization).toBe("Bearer expired");
    expect(meCalls[1]?.authorization).toBe("Bearer at-2");
  });

  it("clears tokens and returns null when the refresh fails", async () => {
    setAuthTokens("expired", "rt-invalid");
    const onSessionExpired = vi.fn();
    setSessionExpiredHandler(onSessionExpired);
    queueResponse("/auth/me", 401, {
      success: false,
      error: { code: "AUTHENTICATION_REQUIRED", message: "Unauthorized" },
    });
    queueResponse("/auth/refresh", 401, {
      success: false,
      error: { code: "INVALID_REFRESH_TOKEN", message: "Invalid refresh token" },
    });

    const result = await authService.getSessionUser();

    expect(result).toBeNull();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(onSessionExpired).toHaveBeenCalled();
  });

  it("propagates network errors without clearing the session", async () => {
    setAuthTokens("at-1", "rt-1");
    queueResponse("/auth/me", 0, undefined, true);

    await expect(authService.getSessionUser()).rejects.toMatchObject({
      code: "NETWORK_ERROR",
    });

    expect(getAccessToken()).toBe("at-1");
    expect(getRefreshToken()).toBe("rt-1");
  });

  it("performs a single refresh for concurrent 401s", async () => {
    setAuthTokens("expired", "rt-1");
    for (let i = 0; i < 5; i++) {
      queueResponse("/auth/me", 401, {
        success: false,
        error: { code: "AUTHENTICATION_REQUIRED", message: "Unauthorized" },
      });
    }
    queueResponse("/auth/refresh", 200, {
      success: true,
      data: { accessToken: "at-2", refreshToken: "rt-2" },
    });
    for (let i = 0; i < 5; i++) {
      queueResponse("/auth/me", 200, { success: true, data: testUser });
    }

    const results = await Promise.all(
      Array.from({ length: 5 }, () => authService.getSessionUser()),
    );

    expect(results).toEqual([
      testUser,
      testUser,
      testUser,
      testUser,
      testUser,
    ]);
    expect(recordedCalls("/auth/refresh")).toHaveLength(1);
  });

  it("calls /auth/logout and clears local tokens", async () => {
    setAuthTokens("at-1", "rt-1");
    queueResponse("/auth/logout", 200, { success: true, data: null });

    await authService.logout();

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();

    const logoutCalls = recordedCalls("/auth/logout");
    expect(logoutCalls).toHaveLength(1);
    expect(logoutCalls[0]?.authorization).toBeNull();
  });

  it("clears local tokens even when the logout request fails", async () => {
    setAuthTokens("at-1", "rt-1");
    queueResponse("/auth/logout", 500, {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      },
    });

    await authService.logout();

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });
});
