export type StaffRole = "MANAGER" | "CASHIER" | "WAITER" | "KITCHEN";

export type StaffStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export const STAFF_ROLES: readonly StaffRole[] = [
  "MANAGER",
  "CASHIER",
  "WAITER",
  "KITCHEN",
] as const;

export const STAFF_STATUSES: readonly StaffStatus[] = [
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
] as const;

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  status: StaffStatus;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffInput {
  name: string;
  email: string;
  password: string;
  role: StaffRole;
}

export interface UpdateStaffInput {
  name: string;
  email: string;
  role: StaffRole;
}
