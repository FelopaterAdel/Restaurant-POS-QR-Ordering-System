import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
} from "@/lib/auth";
import type { ApiPaginated, ApiSuccess } from "@/types/api";
import { ApiError, normalizeApiError } from "./errors";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

export interface ApiRequestConfig extends AxiosRequestConfig {
  skipAuthRefresh?: boolean;
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  skipAuthRefresh?: boolean;
  authRetried?: boolean;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

let sessionExpiredHandler: (() => void) | null = null;
let refreshPromise: Promise<string> | null = null;

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  sessionExpiredHandler = handler;
}

function notifySessionExpired(): void {
  clearAuthTokens();
  sessionExpiredHandler?.();
}

async function requestAccessTokenRefresh(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = performTokenRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function performTokenRefresh(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new ApiError(401, "AUTHENTICATION_REQUIRED", "No refresh token");
  }

  const config: ApiRequestConfig = { skipAuthRefresh: true };
  const response = await apiClient.post<ApiSuccess<TokenPair>>(
    "/auth/refresh",
    { refreshToken },
    config,
  );

  setAuthTokens(
    response.data.data.accessToken,
    response.data.data.refreshToken,
  );

  return response.data.data.accessToken;
}

function isRetryableAuthError(error: unknown): error is AxiosError {
  if (!axios.isAxiosError(error) || error.response?.status !== 401) {
    return false;
  }

  const config = error.config as RetryableRequestConfig | undefined;
  return (
    config !== undefined &&
    config.skipAuthRefresh !== true &&
    config.authRetried !== true
  );
}

function isRetriedAuthError(error: unknown): error is AxiosError {
  if (!axios.isAxiosError(error) || error.response?.status !== 401) {
    return false;
  }
  return (error.config as RetryableRequestConfig | undefined)?.authRetried === true;
}

async function retryRequestWithNewToken(error: AxiosError): Promise<AxiosResponse> {
  const accessToken = await requestAccessTokenRefresh();

  const originalConfig = error.config as InternalAxiosRequestConfig;
  const retryConfig = {
    ...originalConfig,
    headers: AxiosHeaders.from(originalConfig.headers),
    authRetried: true,
  } as RetryableRequestConfig;

  retryConfig.headers.set("Authorization", `Bearer ${accessToken}`);

  return apiClient.request(retryConfig);
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15_000,
});

apiClient.interceptors.request.use((config) => {
  if ((config as RetryableRequestConfig).skipAuthRefresh === true) {
    return config;
  }

  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (isRetryableAuthError(error)) {
      return retryRequestWithNewToken(error).catch((retryError: unknown) => {
        notifySessionExpired();
        return Promise.reject(normalizeApiError(retryError));
      });
    }

    if (isRetriedAuthError(error)) {
      notifySessionExpired();
    }

    return Promise.reject(normalizeApiError(error));
  },
);

export const api = {
  async get<T>(url: string, config?: ApiRequestConfig): Promise<T> {
    const response = await apiClient.get<ApiSuccess<T>>(url, config);
    return response.data.data;
  },

  async getPaginated<T>(
    url: string,
    config?: ApiRequestConfig,
  ): Promise<ApiPaginated<T>> {
    const response = await apiClient.get<ApiPaginated<T>>(url, config);
    return response.data;
  },

  async post<T>(
    url: string,
    body?: unknown,
    config?: ApiRequestConfig,
  ): Promise<T> {
    const response = await apiClient.post<ApiSuccess<T>>(url, body, config);
    return response.data.data;
  },

  async patch<T>(
    url: string,
    body?: unknown,
    config?: ApiRequestConfig,
  ): Promise<T> {
    const response = await apiClient.patch<ApiSuccess<T>>(url, body, config);
    return response.data.data;
  },

  async delete<T>(url: string, config?: ApiRequestConfig): Promise<T> {
    const response = await apiClient.delete<ApiSuccess<T>>(url, config);
    return response.data.data;
  },
};
