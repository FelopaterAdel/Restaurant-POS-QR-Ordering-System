import { Button, Modal } from "@/components/ui";
import type { Staff, StaffStatus } from "../users.types";

const STATUS_ACTION: Record<StaffStatus, { target: StaffStatus; label: string; message: string }> = {
  ACTIVE: {
    target: "SUSPENDED",
    label: "Suspend",
    message: "will no longer be able to access the restaurant system.",
  },
  SUSPENDED: {
    target: "ACTIVE",
    label: "Activate",
    message: "will be able to access the system again.",
  },
  INACTIVE: {
    target: "ACTIVE",
    label: "Activate",
    message: "will be able to access the system again.",
  },
};

export interface ToggleStaffStatusDialogProps {
  open: boolean;
  staff: Staff | null;
  onClose: () => void;
  onConfirm: (staffId: string, status: StaffStatus) => void;
  isPending: boolean;
}

export function ToggleStaffStatusDialog({
  open,
  staff,
  onClose,
  onConfirm,
  isPending,
}: ToggleStaffStatusDialogProps) {
  if (!staff) return null;

  const action = STATUS_ACTION[staff.status];

  return (
    <Modal
      open={open}
      title={`${action.label} Staff Member?`}
      onClose={onClose}
      footer={
        <div className="staff-toggle-dialog__actions">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant={action.target === "SUSPENDED" ? "danger" : "primary"}
            loading={isPending}
            loadingText={action.target === "SUSPENDED" ? "Suspending..." : "Activating..."}
            onClick={() => onConfirm(staff.id, action.target)}
          >
            {action.label}
          </Button>
        </div>
      }
    >
      <div className="staff-toggle-dialog">
        <p className="staff-toggle-dialog__message">
          <strong>{staff.name}</strong> {action.message}
        </p>
      </div>
    </Modal>
  );
}
