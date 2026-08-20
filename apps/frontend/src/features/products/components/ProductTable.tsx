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
import type { Product } from "../products.types";

interface ProductTableSkeletonProps {
  rows?: number;
}

export function ProductTableSkeleton({ rows = 5 }: ProductTableSkeletonProps) {
  return (
    <div className="menu-table-skeleton">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="menu-table-skeleton__row" />
      ))}
    </div>
  );
}

export interface ProductTableProps {
  products: Product[];
  canManage: boolean;
  onEdit: (product: Product) => void;
  onToggle: (product: Product) => void;
}

export function ProductTable({
  products,
  canManage,
  onEdit,
  onToggle,
}: ProductTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHeaderCell>Image</TableHeaderCell>
          <TableHeaderCell>Product</TableHeaderCell>
          <TableHeaderCell>Price</TableHeaderCell>
          <TableHeaderCell>Category</TableHeaderCell>
          {canManage && <TableHeaderCell>Actions</TableHeaderCell>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell>
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="product-image-preview"
                />
              ) : (
                <div className="product-image-placeholder">🍽</div>
              )}
            </TableCell>
            <TableCell>
              <div className="menu-table__name">{product.name}</div>
              {product.description && (
                <div className="menu-table__description">
                  {product.description}
                </div>
              )}
            </TableCell>
            <TableCell>{product.price}</TableCell>
            <TableCell>
              <Badge variant="neutral">
                {product.category?.name ?? "—"}
              </Badge>
            </TableCell>
            {canManage && (
              <TableCell>
                <div className="menu-table__actions">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(product)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggle(product)}
                  >
                    {product.isAvailable ? "Disable" : "Enable"}
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
