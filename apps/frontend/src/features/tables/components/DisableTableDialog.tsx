import { useEffect, useState } from "react";
import { Button, Modal } from "@/components/ui";
import { ApiError, getApiErrorMessage } from "@/lib/api";
import type { Table } from "../tables.types";

export interface DisableTableDialogProps {
  open: boolean;
  table: Table | null;
  onClose: () => void;
  onConfirm: (tableId: string) => void;
  isPending: boolean;
}

export function DisableTableDialog({
  open,
  table,
  onClose,
  onConfirm,
  isPending,
  error,
}: DisableTableDialogProps & { error?: unknown }) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (error instanceof ApiError && error.code === "TABLE_HAS_ACTIVE_ORDERS") {
      setSubmitError(
        "This table has active orders and cannot be disabled.",
      );
    } else if (error) {
      setSubmitError(getApiErrorMessage(error));
    } else {
      setSubmitError(null);
    }
  }, [error]);

  return (
    <Modal
      open={open}
      title="Disable Table"
      onClose={onClose}
      footer={
        <div className="table-disable-dialog__actions">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => table && onConfirm(table.id)}
            disabled={isPending}
          >
            {isPending ? "Disabling..." : "Disable Table"}
          </Button>
        </div>
      }
    >
      <div className="table-disable-dialog">
        <p className="table-disable-dialog__message">
          Are you sure you want to disable this table? This action cannot be
          undone while the table has active orders.
        </p>
        {table && (
          <div className="table-disable-dialog__table-info">
            Table #{table.number} &mdash; {table.name}
          </div>
        )}
        {submitError && (
          <p className="table-disable-dialog__error" role="alert">
            {submitError}
          </p>
        )}
      </div>
    </Modal>
  );
}
