import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { canAccess, type PagePermission } from "@/features/auth/permissions";

export function RoleRoute({ permission }: { permission: PagePermission }) {
  const { user } = useAuth();

  if (!user || !canAccess(user, permission)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
