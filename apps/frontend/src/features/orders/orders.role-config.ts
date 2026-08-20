import type { OrderStatus } from "@/components/ui";
import type { UserRole } from "@/features/auth/types";
import type { Order } from "./orders.types";
import type { QueueFilterKey } from "./components/OrderFilters";

export interface StatusAction {
  label: string;
  nextStatus: OrderStatus;
  variant: "primary" | "danger";
}

export interface RoleOrderConfig {
  visibleStatuses: readonly OrderStatus[];
  defaultFilter: QueueFilterKey;
  filters: QueueFilterKey[];
  getStatusActions: (order: Order) => StatusAction[];
  canPay: boolean;
  canComplete: boolean;
}

const PAYABLE_STATUSES: OrderStatus[] = ["READY", "SERVED"];
const COMPLETE_ROLES: UserRole[] = ["OWNER", "MANAGER", "CASHIER"];
const TERMINAL_STATUSES: OrderStatus[] = ["CANCELLED", "COMPLETED"];

function kitchenActions(order: Order): StatusAction[] {
  const { status } = order;
  if (status === "PENDING")
    return [{ label: "Confirm", nextStatus: "CONFIRMED", variant: "primary" }];
  if (status === "CONFIRMED")
    return [
      { label: "Start Preparing", nextStatus: "PREPARING", variant: "primary" },
    ];
  if (status === "PREPARING")
    return [{ label: "Mark Ready", nextStatus: "READY", variant: "primary" }];
  return [];
}

function waiterActions(order: Order): StatusAction[] {
  if (order.status === "READY")
    return [
      { label: "Mark Served", nextStatus: "SERVED", variant: "primary" },
    ];
  return [];
}

function managerActions(order: Order): StatusAction[] {
  const { status } = order;
  const actions: StatusAction[] = [];

  if (status === "PENDING")
    actions.push({ label: "Confirm", nextStatus: "CONFIRMED", variant: "primary" });
  if (status === "CONFIRMED")
    actions.push({
      label: "Start Preparing",
      nextStatus: "PREPARING",
      variant: "primary",
    });
  if (status === "PREPARING")
    actions.push({ label: "Mark Ready", nextStatus: "READY", variant: "primary" });
  if (status === "READY")
    actions.push({ label: "Mark Served", nextStatus: "SERVED", variant: "primary" });
  if (["PENDING", "CONFIRMED", "PREPARING"].includes(status))
    actions.push({ label: "Cancel Order", nextStatus: "CANCELLED", variant: "danger" });

  return actions;
}

function cashierActions(): StatusAction[] {
  return [];
}

function getStatusActionsForRole(
  order: Order,
  role: UserRole,
): StatusAction[] {
  switch (role) {
    case "KITCHEN":
      return kitchenActions(order);
    case "WAITER":
      return waiterActions(order);
    case "OWNER":
    case "MANAGER":
      return managerActions(order);
    case "CASHIER":
      return cashierActions();
  }
}

const ROLE_CONFIGS: Record<UserRole, RoleOrderConfig> = {
  KITCHEN: {
    visibleStatuses: ["PENDING", "CONFIRMED", "PREPARING", "READY"],
    defaultFilter: "all",
    filters: ["all", "PENDING", "CONFIRMED", "PREPARING", "READY"],
    getStatusActions: kitchenActions,
    canPay: false,
    canComplete: false,
  },
  WAITER: {
    visibleStatuses: ["READY"],
    defaultFilter: "all",
    filters: ["all", "READY"],
    getStatusActions: waiterActions,
    canPay: false,
    canComplete: false,
  },
  CASHIER: {
    visibleStatuses: ["READY", "SERVED"],
    defaultFilter: "all",
    filters: ["all", "READY", "SERVED"],
    getStatusActions: cashierActions,
    canPay: true,
    canComplete: true,
  },
  OWNER: {
    visibleStatuses: ["PENDING", "CONFIRMED", "PREPARING", "READY", "SERVED"],
    defaultFilter: "all",
    filters: ["all", "PENDING", "CONFIRMED", "PREPARING", "READY"],
    getStatusActions: managerActions,
    canPay: true,
    canComplete: true,
  },
  MANAGER: {
    visibleStatuses: ["PENDING", "CONFIRMED", "PREPARING", "READY", "SERVED"],
    defaultFilter: "all",
    filters: ["all", "PENDING", "CONFIRMED", "PREPARING", "READY"],
    getStatusActions: managerActions,
    canPay: true,
    canComplete: true,
  },
};

export function getRoleOrderConfig(role: UserRole): RoleOrderConfig {
  return ROLE_CONFIGS[role];
}

export function getOrderActions(
  order: Order,
  role: UserRole,
): StatusAction[] {
  return getStatusActionsForRole(order, role);
}

export function canPayOrder(order: Order, role: UserRole): boolean {
  if (role === "OWNER" || role === "MANAGER" || role === "CASHIER") {
    return (
      PAYABLE_STATUSES.includes(order.status) &&
      order.paymentStatus === "PENDING"
    );
  }
  return false;
}

export function canCompleteOrder(order: Order, role: UserRole): boolean {
  if (!COMPLETE_ROLES.includes(role)) return false;
  if (TERMINAL_STATUSES.includes(order.status)) return false;
  return order.paymentStatus === "PAID";
}
