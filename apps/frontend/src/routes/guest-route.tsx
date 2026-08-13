import { Navigate, Outlet } from "react-router-dom";
import { AuthLoading } from "@/components/ui/auth-loading";
import { useAuth } from "@/features/auth";
import { getDefaultRoute } from "@/features/auth/permissions";

export function GuestRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <AuthLoading />;
  }

  if (isAuthenticated && user) {
    return <Navigate to={getDefaultRoute(user)} replace />;
  }

  return <Outlet />;
}
