import { Card, CardBody, TableStatusBadge } from "@/components/ui";
import { Button } from "@/components/ui";
import type { Table } from "../tables.types";

export interface TableCardProps {
  table: Table;
  canManage: boolean;
  onEdit: (table: Table) => void;
  onDisable: (table: Table) => void;
  onEnable: (table: Table) => void;
  onShowQr: (table: Table) => void;
}

function QrIcon() {
  return (
    <svg
      className="table-card__qr-icon"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="8" height="8" rx="1" />
      <rect x="14" y="2" width="8" height="8" rx="1" />
      <rect x="2" y="14" width="8" height="8" rx="1" />
      <rect x="14" y="14" width="4" height="4" rx="1" />
      <rect x="20" y="14" width="2" height="2" rx="0.5" />
      <rect x="14" y="20" width="2" height="2" rx="0.5" />
      <rect x="20" y="20" width="2" height="2" rx="0.5" />
    </svg>
  );
}

export function TableCard({
  table,
  canManage,
  onEdit,
  onDisable,
  onEnable,
  onShowQr,
}: TableCardProps) {
  const isDisabled = table.status === "DISABLED";

  return (
    <Card>
      <CardBody className="table-card">
        <div className="table-card__header">
          <div>
            <h3 className="table-card__number">Table #{table.number}</h3>
            <p className="table-card__name">{table.name}</p>
          </div>
          <TableStatusBadge status={table.status} />
        </div>

        {isDisabled ? (
          <div className="table-card__qr table-card__qr--empty" aria-hidden="true">
            &mdash;
          </div>
        ) : (
          <button
            type="button"
            className="table-card__qr"
            onClick={() => onShowQr(table)}
            aria-label={`Show QR code for Table #${table.number}`}
          >
            <QrIcon />
          </button>
        )}

        {canManage && (
          <div className="table-card__actions">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(table)}
            >
              Edit
            </Button>
            {isDisabled ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onEnable(table)}
              >
                Enable
              </Button>
            ) : (
              <Button
                variant="danger"
                size="sm"
                onClick={() => onDisable(table)}
              >
                Disable
              </Button>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
