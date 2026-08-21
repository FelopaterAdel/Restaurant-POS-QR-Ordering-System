import type { Staff } from "../users.types";
import { StaffRoleBadge } from "./StaffRoleBadge";
import { StaffStatusBadge } from "./StaffStatusBadge";

export interface StaffDetailsProps {
  staff: Staff;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString();
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Never";
  }
  return new Date(value).toLocaleString();
}

export function StaffDetails({ staff }: StaffDetailsProps) {
  return (
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
        <span className="staff-details__value">{formatDate(staff.createdAt)}</span>
      </div>
      <div className="staff-details__row">
        <span className="staff-details__label">Last Login</span>
        <span className="staff-details__value">
          {formatDateTime(staff.lastLoginAt)}
        </span>
      </div>
    </div>
  );
}
