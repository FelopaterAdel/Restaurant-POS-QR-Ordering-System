import { Badge } from "@/components/ui";
import type { StaffStatus } from "../users.types";

const STATUS_VARIANT: Record<StaffStatus, "success" | "danger" | "warning"> = {
  ACTIVE: "success",
  SUSPENDED: "danger",
  INACTIVE: "warning",
};

export interface StaffStatusBadgeProps {
  status: StaffStatus;
}

export function StaffStatusBadge({ status }: StaffStatusBadgeProps) {
  return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>;
}
