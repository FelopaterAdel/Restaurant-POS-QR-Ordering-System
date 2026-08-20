import {
  Button,
  EmptyState,
  ErrorState,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";
import type { OrderHistoryItem, Pagination } from "../orders.types";
import { OrderHistoryRow } from "./OrderHistoryRow";

function TableSkeleton() {
  return (
    <div className="history-skeleton" aria-label="Loading order history">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="history-skeleton__row">
          <Skeleton className="history-skeleton__cell" />
          <Skeleton className="history-skeleton__cell history-skeleton__cell--sm" />
          <Skeleton className="history-skeleton__cell" />
          <Skeleton className="history-skeleton__cell history-skeleton__cell--sm" />
          <Skeleton className="history-skeleton__cell" />
        </div>
      ))}
    </div>
  );
}

function PaginationInfo({
  pagination,
}: {
  pagination: Pagination;
}) {
  const start = (pagination.page - 1) * pagination.limit + 1;
  const end = Math.min(pagination.page * pagination.limit, pagination.total);
  return (
    <span className="history-pagination__info">
      Showing {start}–{end} of {pagination.total} orders
    </span>
  );
}

export interface OrderHistoryTableProps {
  orders: OrderHistoryItem[];
  pagination: Pagination | undefined;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  onOrderClick: (order: OrderHistoryItem) => void;
  onPageChange: (page: number) => void;
  onClearFilters: () => void;
}

export function OrderHistoryTable({
  orders,
  pagination,
  isLoading,
  error,
  onRetry,
  onOrderClick,
  onPageChange,
  onClearFilters,
}: OrderHistoryTableProps) {
  if (isLoading) {
    return <TableSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load order history"
        description={
          error.message || "Something went wrong while loading order history."
        }
        action={<Button onClick={onRetry}>Try Again</Button>}
      />
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        title="No orders found"
        description="No orders match the selected filters."
        action={
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Clear Filters
          </Button>
        }
      />
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Order</TableHeaderCell>
            <TableHeaderCell>Table</TableHeaderCell>
            <TableHeaderCell>Total</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Date</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <OrderHistoryRow
              key={order.id}
              order={order}
              onClick={onOrderClick}
            />
          ))}
        </TableBody>
      </Table>

      {pagination && pagination.totalPages > 1 && (
        <nav className="history-pagination" aria-label="History pagination">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
          >
            Previous
          </Button>
          <PaginationInfo pagination={pagination} />
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            Next
          </Button>
        </nav>
      )}
    </>
  );
}
