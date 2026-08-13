import axios, { type AxiosRequestConfig } from "axios";
import { getAccessToken } from "@/lib/auth";
import type { ApiPaginated, ApiSuccess } from "@/types/api";
import { normalizeApiError } from "./errors";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15_000,
});

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(normalizeApiError(error)),
);

export const api = {
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.get<ApiSuccess<T>>(url, config);
    return response.data.data;
  },

  async getPaginated<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiPaginated<T>> {
    const response = await apiClient.get<ApiPaginated<T>>(url, config);
    return response.data;
  },

  async post<T>(
    url: string,
    body?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await apiClient.post<ApiSuccess<T>>(url, body, config);
    return response.data.data;
  },

  async patch<T>(
    url: string,
    body?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await apiClient.patch<ApiSuccess<T>>(url, body, config);
    return response.data.data;
  },

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.delete<ApiSuccess<T>>(url, config);
    return response.data.data;
  },
};
