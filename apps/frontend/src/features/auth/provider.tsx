import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { setSessionExpiredHandler } from "@/lib/api";
import { AuthContext, type AuthState } from "./context";
import { authService } from "./service";
import type { LoginCredentials } from "./types";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    let cancelled = false;

    setSessionExpiredHandler(() => {
      if (!cancelled) {
        setState({ user: null, isAuthenticated: false, isLoading: false });
      }
    });

    authService
      .getSessionUser()
      .then((user) => {
        if (!cancelled) {
          setState({
            user,
            isAuthenticated: user !== null,
            isLoading: false,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ user: null, isAuthenticated: false, isLoading: false });
        }
      });

    return () => {
      cancelled = true;
      setSessionExpiredHandler(null);
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const user = await authService.login(credentials);
    setState({ user, isAuthenticated: true, isLoading: false });
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  const value = useMemo(
    () => ({ ...state, login, logout }),
    [state, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
