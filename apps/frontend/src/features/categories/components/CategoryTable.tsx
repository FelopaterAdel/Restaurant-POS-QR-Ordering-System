import {
  Button,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Badge,
} from "@/components/ui";
import type { Category } from "../categories.types";

interface CategoryTableSkeletonProps {
  rows?: number;
}

export function CategoryTableSkeleton({ rows = 5 }: CategoryTableSkeletonProps) {
  return (
    <div className="menu-table-skeleton">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="menu-table-skeleton__row" />
      ))}
    </div>
  );
}

export interface CategoryTableProps {
  categories: Category[];
  canManage: boolean;
  onEdit: (category: Category) => void;
  onToggle: (category: Category) => void;
}

export function CategoryTable({
  categories,
  canManage,
  onEdit,
  onToggle,
}: CategoryTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          {canManage && <TableHeaderCell>Actions</TableHeaderCell>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((category) => (
          <TableRow key={category.id}>
            <TableCell>
              <div className="menu-table__name">{category.name}</div>
              {category.description && (
                <div className="menu-table__description">
                  {category.description}
                </div>
              )}
            </TableCell>
            <TableCell>
              <Badge variant={category.isActive ? "success" : "danger"}>
                {category.isActive ? "Active" : "Disabled"}
              </Badge>
            </TableCell>
            {canManage && (
              <TableCell>
                <div className="menu-table__actions">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(category)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggle(category)}
                  >
                    {category.isActive ? "Disable" : "Enable"}
                  </Button>
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
