import { Card, CardBody, Skeleton } from "@/components/ui";
import type { Table } from "../tables.types";
import { TableCard } from "./TableCard";

export interface TableGridProps {
  tables: Table[];
  canManage: boolean;
  onEdit: (table: Table) => void;
  onDisable: (table: Table) => void;
  onEnable: (table: Table) => void;
  onShowQr: (table: Table) => void;
}

export function TableGrid({
  tables,
  canManage,
  onEdit,
  onDisable,
  onEnable,
  onShowQr,
}: TableGridProps) {
  return (
    <div className="tables-grid">
      {tables.map((table) => (
        <TableCard
          key={table.id}
          table={table}
          canManage={canManage}
          onEdit={onEdit}
          onDisable={onDisable}
          onEnable={onEnable}
          onShowQr={onShowQr}
        />
      ))}
    </div>
  );
}

export function TableGridSkeleton() {
  return (
    <div className="tables-grid" aria-label="Loading tables">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index}>
          <CardBody className="table-skeleton">
            <Skeleton className="skeleton-line" />
            <Skeleton className="skeleton-value" />
            <Skeleton className="skeleton-block" />
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
