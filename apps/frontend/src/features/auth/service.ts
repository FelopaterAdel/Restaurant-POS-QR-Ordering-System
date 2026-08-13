import { isUnauthorizedError } from "@/lib/api";
import { clearAuthTokens, getRefreshToken, setAuthTokens } from "@/lib/auth";
import { getMe, login as apiLogin, logout as apiLogout } from "./api";
import type { LoginCredentials, SafeUser } from "./types";

export const authService = {
  async login(credentials: LoginCredentials): Promise<SafeUser> {
    const result = await apiLogin(credentials);
    setAuthTokens(result.accessToken, result.refreshToken);
    return result.user;
  },

  async getSessionUser(): Promise<SafeUser | null> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    try {
      return await getMe();
    } catch (error) {
      if (isUnauthorizedError(error)) {
        clearAuthTokens();
        return null;
      }
      throw error;
    }
  },

  async logout(): Promise<void> {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await apiLogout(refreshToken);
      } catch {
        // Local session is cleared regardless of the server response.
      }
    }
    clearAuthTokens();
  },
};
