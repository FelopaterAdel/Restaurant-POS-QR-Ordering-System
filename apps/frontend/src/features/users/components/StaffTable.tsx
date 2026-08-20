import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui";
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
}

export function StaffTable({ staff, onSelect }: StaffTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Email</TableHeaderCell>
          <TableHeaderCell>Role</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {staff.map((member) => (
          <TableRow
            key={member.id}
            className="staff-table__row"
            onClick={() => onSelect(member)}
          >
            <TableCell>
              <div className="staff-table__name">{member.name}</div>
            </TableCell>
            <TableCell>{member.email}</TableCell>
            <TableCell>
              <StaffRoleBadge role={member.role} />
            </TableCell>
            <TableCell>
              <StaffStatusBadge status={member.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
