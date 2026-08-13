import type { UserRole } from "./types";

export const PAGE_PERMISSIONS = [
  "dashboard",
  "users",
  "products",
  "categories",
  "tables",
  "orders",
  "payments",
] as const;

export type PagePermission = (typeof PAGE_PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<UserRole, readonly PagePermission[]> = {
  OWNER: [
    "dashboard",
    "users",
    "products",
    "categories",
    "tables",
    "orders",
    "payments",
  ],
  MANAGER: [
    "dashboard",
    "products",
    "categories",
    "tables",
    "orders",
    "payments",
  ],
  CASHIER: ["orders", "payments"],
  WAITER: ["orders"],
  KITCHEN: ["orders"],
};

export function canAccess(
  user: { role: UserRole },
  permission: PagePermission,
): boolean {
  return ROLE_PERMISSIONS[user.role].includes(permission);
}

export function hasRole(
  user: { role: UserRole },
  roles: UserRole | readonly UserRole[],
): boolean {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return allowed.includes(user.role);
}

export function getDefaultRoute(user: { role: UserRole }): string {
  const permission = PAGE_PERMISSIONS.find((item) => canAccess(user, item));
  return permission ? `/${permission}` : "/login";
}

export function canAccessPath(
  user: { role: UserRole },
  path: string,
): boolean {
  const slug = path.split("/")[1] ?? "";
  if (!isPagePermission(slug)) {
    return false;
  }
  return canAccess(user, slug);
}

export function resolvePostLoginRedirect(
  user: { role: UserRole },
  redirect: string | null,
): string {
  if (
    redirect &&
    redirect.startsWith("/") &&
    !redirect.startsWith("//") &&
    canAccessPath(user, redirect)
  ) {
    return redirect;
  }
  return getDefaultRoute(user);
}

function isPagePermission(value: string): value is PagePermission {
  return (PAGE_PERMISSIONS as readonly string[]).includes(value);
}
