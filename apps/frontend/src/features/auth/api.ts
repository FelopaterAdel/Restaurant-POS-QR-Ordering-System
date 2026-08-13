import { api } from "@/lib/api";
import type {
  AuthResult,
  LoginCredentials,
  RefreshResult,
  SafeUser,
} from "./types";

export async function login(credentials: LoginCredentials): Promise<AuthResult> {
  return api.post<AuthResult>("/auth/login", credentials, {
    skipAuthRefresh: true,
  });
}

export async function refresh(refreshToken: string): Promise<RefreshResult> {
  return api.post<RefreshResult>("/auth/refresh", { refreshToken });
}

export async function logout(refreshToken: string): Promise<null> {
  return api.post<null>(
    "/auth/logout",
    { refreshToken },
    { skipAuthRefresh: true },
  );
}

export async function getMe(): Promise<SafeUser> {
  return api.get<SafeUser>("/auth/me");
}
