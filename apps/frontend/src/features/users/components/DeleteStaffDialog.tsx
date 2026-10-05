import { Button, Modal } from "@/components/ui";
import type { Staff } from "../users.types";

export interface DeleteStaffDialogProps {
  open: boolean;
  staff: Staff | null;
  onClose: () => void;
  onConfirm: (staffId: string) => void;
  isPending: boolean;
}

export function DeleteStaffDialog({
  open,
  staff,
  onClose,
  onConfirm,
  isPending,
}: DeleteStaffDialogProps) {
  if (!staff) return null;

  return (
    <Modal
      open={open}
      title="Delete Staff Member?"
      onClose={onClose}
      footer={
        <div className="staff-toggle-dialog__actions">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={isPending}
            loadingText="Deleting..."
            onClick={() => onConfirm(staff.id)}
          >
            Delete
          </Button>
        </div>
      }
    >
      <div className="staff-toggle-dialog">
        <p className="staff-toggle-dialog__message">
          <strong>{staff.name}</strong> ({staff.email}) will be deactivated
          and will no longer be able to access the restaurant system. You
          can re-activate them later if needed.
        </p>
      </div>
    </Modal>
  );
}
