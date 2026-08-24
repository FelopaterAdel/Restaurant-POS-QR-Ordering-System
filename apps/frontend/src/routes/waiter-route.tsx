import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { hasRole } from "@/features/auth/permissions";

const WAITER_DISPLAY_ROLES = ["OWNER", "MANAGER", "WAITER"] as const;

export function WaiterRoute() {
  const { user } = useAuth();

  if (!user || !hasRole(user, WAITER_DISPLAY_ROLES)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
