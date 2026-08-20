import { Badge } from "@/components/ui";
import type { StaffRole } from "../users.types";

const ROLE_VARIANT: Record<StaffRole, "primary" | "info" | "warning" | "neutral"> = {
  MANAGER: "primary",
  CASHIER: "info",
  WAITER: "warning",
  KITCHEN: "neutral",
};

export interface StaffRoleBadgeProps {
  role: StaffRole;
}

export function StaffRoleBadge({ role }: StaffRoleBadgeProps) {
  return <Badge variant={ROLE_VARIANT[role]}>{role}</Badge>;
}
