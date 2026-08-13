import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthLoading } from "@/components/ui/auth-loading";
import { useAuth } from "@/features/auth";

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <AuthLoading />;
  }

  if (!isAuthenticated) {
    const target = `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`;
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
}
