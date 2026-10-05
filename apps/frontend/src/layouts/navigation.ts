import { canAccess, type PagePermission } from "@/features/auth/permissions";
import type { UserRole } from "@/features/auth/types";

export type NavigationGroup =
  | "Overview"
  | "Service"
  | "Dining"
  | "Menu"
  | "Team"
  | "System";

export interface NavigationItem {
  label: string;
  path: string;
  permission: PagePermission;
  roles?: readonly UserRole[];
  group: NavigationGroup;
  icon: string;
  description: string;
}

export const NAVIGATION_GROUPS: readonly NavigationGroup[] = [
  "Overview",
  "Service",
  "Dining",
  "Menu",
  "Team",
  "System",
] as const;

export const ADMIN_NAVIGATION: readonly NavigationItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    permission: "dashboard",
    group: "Overview",
    icon: "dashboard",
    description: "Today's sales and live status",
  },
  {
    label: "Analytics",
    path: "/analytics",
    permission: "dashboard",
    group: "Overview",
    icon: "analytics",
    description: "Trends and top products",
  },
  {
    label: "Reports",
    path: "/reports",
    permission: "dashboard",
    group: "Overview",
    icon: "reports",
    description: "Exports and summaries",
  },
  {
    label: "Orders",
    path: "/orders",
    permission: "orders",
    group: "Service",
    icon: "orders",
    description: "Live order queue",
  },
  {
    label: "Kitchen",
    path: "/kds",
    permission: "orders",
    roles: ["OWNER", "MANAGER", "KITCHEN"],
    group: "Service",
    icon: "kitchen",
    description: "Kitchen display",
  },
  {
    label: "Ready Orders",
    path: "/waiter",
    permission: "orders",
    roles: ["OWNER", "MANAGER", "WAITER"],
    group: "Service",
    icon: "bell",
    description: "Pickup and serving",
  },
  {
    label: "Payments",
    path: "/payments",
    permission: "payments",
    group: "Service",
    icon: "payments",
    description: "Charges and history",
  },
  {
    label: "Tables",
    path: "/tables",
    permission: "tables",
    group: "Dining",
    icon: "tables",
    description: "Floor and QR codes",
  },
  {
    label: "Reservations",
    path: "/reservations",
    permission: "reservations",
    group: "Dining",
    icon: "reservations",
    description: "Bookings and guests",
  },
  {
    label: "Products",
    path: "/products",
    permission: "products",
    group: "Menu",
    icon: "products",
    description: "Dishes and prices",
  },
  {
    label: "Categories",
    path: "/categories",
    permission: "categories",
    group: "Menu",
    icon: "categories",
    description: "Menu sections",
  },
  {
    label: "Inventory",
    path: "/inventory",
    permission: "products",
    group: "Menu",
    icon: "inventory",
    description: "Stock levels",
  },
  {
    label: "Coupons",
    path: "/coupons",
    permission: "products",
    group: "Menu",
    icon: "coupons",
    description: "Discounts",
  },
  {
    label: "Users",
    path: "/users",
    permission: "users",
    group: "Team",
    icon: "users",
    description: "Staff and roles",
  },
  {
    label: "Audit Log",
    path: "/audit-log",
    permission: "audit",
    group: "System",
    icon: "audit",
    description: "Activity trail",
  },
  {
    label: "Settings",
    path: "/settings",
    permission: "settings",
    group: "System",
    icon: "settings",
    description: "Restaurant profile",
  },
];

export function getVisibleNavigation(
  user: { role: UserRole } | null,
): NavigationItem[] {
  if (!user) {
    return [];
  }
  return ADMIN_NAVIGATION.filter(
    (item) =>
      canAccess(user, item.permission) &&
      (!item.roles || item.roles.includes(user.role)),
  );
}

export function getGroupedNavigation(
  user: { role: UserRole } | null,
): Array<{ group: NavigationGroup; items: NavigationItem[] }> {
  const visible = getVisibleNavigation(user);
  return NAVIGATION_GROUPS.map((group) => ({
    group,
    items: visible.filter((item) => item.group === group),
  })).filter((section) => section.items.length > 0);
}
