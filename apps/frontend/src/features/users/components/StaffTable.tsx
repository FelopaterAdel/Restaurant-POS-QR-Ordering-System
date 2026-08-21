import {
  Button,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui";
import { useAuth } from "@/features/auth";
import { canAccess } from "@/features/auth/permissions";
import type { Staff } from "../users.types";
import { StaffRoleBadge } from "./StaffRoleBadge";
import { StaffStatusBadge } from "./StaffStatusBadge";

export interface StaffTableSkeletonProps {
  rows?: number;
}

export function StaffTableSkeleton({ rows = 5 }: StaffTableSkeletonProps) {
  return (
    <div className="staff-table-skeleton">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="staff-table-skeleton__row" />
      ))}
    </div>
  );
}

export interface StaffTableProps {
  staff: Staff[];
  onSelect: (staff: Staff) => void;
  onToggleStatus: (staff: Staff) => void;
}

export function StaffTable({ staff, onSelect, onToggleStatus }: StaffTableProps) {
  const { user } = useAuth();
  const canManage = user ? canAccess(user, "users") : false;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Email</TableHeaderCell>
          <TableHeaderCell>Role</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Actions</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {staff.map((member) => (
          <TableRow key={member.id}>
            <TableCell>
              <div
                className="staff-table__name staff-table__name--clickable"
                onClick={() => onSelect(member)}
              >
                {member.name}
              </div>
            </TableCell>
            <TableCell>{member.email}</TableCell>
            <TableCell>
              <StaffRoleBadge role={member.role} />
            </TableCell>
            <TableCell>
              <StaffStatusBadge status={member.status} />
            </TableCell>
            <TableCell>
              <div className="staff-table__actions">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelect(member)}
                >
                  Details
                </Button>
                {canManage && member.status === "ACTIVE" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleStatus(member)}
                  >
                    Suspend
                  </Button>
                )}
                {canManage &&
                  (member.status === "SUSPENDED" ||
                    member.status === "INACTIVE") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleStatus(member)}
                    >
                      Activate
                    </Button>
                  )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
