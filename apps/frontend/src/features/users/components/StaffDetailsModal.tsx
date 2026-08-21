import { Button, Modal } from "@/components/ui";
import { useAuth } from "@/features/auth";
import { canAccess } from "@/features/auth/permissions";
import type { Staff } from "../users.types";
import { StaffDetails } from "./StaffDetails";

export interface StaffDetailsModalProps {
  open: boolean;
  staff: Staff | null;
  onClose: () => void;
  onEdit: (staff: Staff) => void;
  onToggleStatus: (staff: Staff) => void;
}

export function StaffDetailsModal({
  open,
  staff,
  onClose,
  onEdit,
  onToggleStatus,
}: StaffDetailsModalProps) {
  const { user } = useAuth();
  const canManage = user ? canAccess(user, "users") : false;

  return (
    <Modal
      open={open}
      title="Staff Details"
      onClose={onClose}
      footer={
        <div className="staff-details__footer">
          <div className="staff-details__actions-left">
            {staff && canManage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(staff)}
              >
                Edit Staff
              </Button>
            )}
          </div>
          <div className="staff-details__actions-right">
            {staff && canManage && staff.status === "ACTIVE" && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => onToggleStatus(staff)}
              >
                Suspend
              </Button>
            )}
            {staff &&
              canManage &&
              (staff.status === "SUSPENDED" || staff.status === "INACTIVE") && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onToggleStatus(staff)}
                >
                  Activate
                </Button>
              )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      {staff && <StaffDetails staff={staff} />}
    </Modal>
  );
}
