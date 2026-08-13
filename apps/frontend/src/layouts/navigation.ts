import { canAccess, type PagePermission } from "@/features/auth/permissions";
import type { UserRole } from "@/features/auth/types";

export interface NavigationItem {
  label: string;
  path: string;
  permission: PagePermission;
}

export const ADMIN_NAVIGATION: readonly NavigationItem[] = [
  { label: "Dashboard", path: "/dashboard", permission: "dashboard" },
  { label: "Orders", path: "/orders", permission: "orders" },
  { label: "Tables", path: "/tables", permission: "tables" },
  { label: "Products", path: "/products", permission: "products" },
  { label: "Categories", path: "/categories", permission: "categories" },
  { label: "Users", path: "/users", permission: "users" },
];

export function getVisibleNavigation(
  user: { role: UserRole } | null,
): NavigationItem[] {
  if (!user) {
    return [];
  }
  return ADMIN_NAVIGATION.filter((item) => canAccess(user, item.permission));
}
