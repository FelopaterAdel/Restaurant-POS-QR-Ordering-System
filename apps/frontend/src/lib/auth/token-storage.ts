const REFRESH_TOKEN_KEY = "pos.refresh_token";

let accessToken: string | null = null;

function hasStorage(): boolean {
  return typeof window !== "undefined" && "localStorage" in window;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string): void {
  accessToken = token;
}

export function getRefreshToken(): string | null {
  if (!hasStorage()) {
    return null;
  }
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string): void {
  if (!hasStorage()) {
    return;
  }
  window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function setAuthTokens(accessTokenValue: string, refreshToken: string): void {
  accessToken = accessTokenValue;
  if (hasStorage()) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearAuthTokens(): void {
  accessToken = null;
  if (hasStorage()) {
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}
