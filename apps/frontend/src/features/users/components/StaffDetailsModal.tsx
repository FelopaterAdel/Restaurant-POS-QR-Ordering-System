import { Button, Modal } from "@/components/ui";
import { useAuth } from "@/features/auth";
import type { Staff } from "../users.types";
import { StaffRoleBadge } from "./StaffRoleBadge";
import { StaffStatusBadge } from "./StaffStatusBadge";

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
  const canEdit = user?.role === "OWNER";

  return (
    <Modal
      open={open}
      title="Staff Details"
      onClose={onClose}
      footer={
        <div className="staff-details__footer">
          <div className="staff-details__actions-left">
            {staff && canEdit && (
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
            {staff && staff.status === "ACTIVE" && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => onToggleStatus(staff)}
              >
                Suspend
              </Button>
            )}
            {staff && (staff.status === "SUSPENDED" || staff.status === "INACTIVE") && (
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
      {staff && (
        <div className="staff-details">
          <div className="staff-details__row">
            <span className="staff-details__label">Name</span>
            <span className="staff-details__value">{staff.name}</span>
          </div>
          <div className="staff-details__row">
            <span className="staff-details__label">Email</span>
            <span className="staff-details__value">{staff.email}</span>
          </div>
          <div className="staff-details__row">
            <span className="staff-details__label">Role</span>
            <StaffRoleBadge role={staff.role} />
          </div>
          <div className="staff-details__row">
            <span className="staff-details__label">Status</span>
            <StaffStatusBadge status={staff.status} />
          </div>
          <div className="staff-details__row">
            <span className="staff-details__label">Created At</span>
            <span className="staff-details__value">
              {new Date(staff.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}
    </Modal>
  );
}
