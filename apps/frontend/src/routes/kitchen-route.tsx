import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { hasRole } from "@/features/auth/permissions";

const KITCHEN_DISPLAY_ROLES = ["OWNER", "MANAGER", "KITCHEN"] as const;

export function KitchenRoute() {
  const { user } = useAuth();

  if (!user || !hasRole(user, KITCHEN_DISPLAY_ROLES)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
