import { Badge, type BadgeVariant } from "./badge";
import type { TableStatus } from "./table-status";

const STATUS_VARIANT: Record<TableStatus, BadgeVariant> = {
  AVAILABLE: "success",
  OCCUPIED: "warning",
  DISABLED: "danger",
};

const STATUS_LABEL: Record<TableStatus, string> = {
  AVAILABLE: "Available",
  OCCUPIED: "Occupied",
  DISABLED: "Disabled",
};

export function TableStatusBadge({ status }: { status: TableStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
