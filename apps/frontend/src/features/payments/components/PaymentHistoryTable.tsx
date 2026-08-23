import {
  Button,
  EmptyState,
  ErrorState,
  PaymentStatusBadge,
  Skeleton,
  Table,
  TableBody,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";
import type { Pagination } from "@/types/pagination";
import { formatCurrency, formatPaidAt } from "@/lib/format";
import type { PaymentHistoryItem } from "../history.types";

function PaymentHistoryRow({
  payment,
  onClick,
}: {
  payment: PaymentHistoryItem;
  onClick: (payment: PaymentHistoryItem) => void;
}) {
  return (
    <TableRow
      className="history-row"
      onClick={() => onClick(payment)}
      role="button"
      tabIndex={0}
      aria-label={`Payment for order #${payment.orderNumber}, Table ${payment.tableNumber}`}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick(payment);
        }
      }}
    >
      <td className="table__cell">#{payment.orderNumber}</td>
      <td className="table__cell">{payment.tableNumber}</td>
      <td className="table__cell history-row__amount">
        {formatCurrency(payment.amount)}
      </td>
      <td className="table__cell">
        <PaymentStatusBadge status={payment.status} />
      </td>
      <td className="table__cell">{formatPaidAt(payment.paidAt)}</td>
    </TableRow>
  );
}

function TableSkeleton() {
  return (
    <div
      className="history-skeleton"
      role="status"
      aria-label="Loading payment history"
    >
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

function PaginationInfo({ pagination }: { pagination: Pagination }) {
  const start = (pagination.page - 1) * pagination.limit + 1;
  const end = Math.min(pagination.page * pagination.limit, pagination.total);
  return (
    <span className="history-pagination__info">
      Showing {start}–{end} of {pagination.total} payments
    </span>
  );
}

export interface PaymentHistoryTableProps {
  payments: PaymentHistoryItem[];
  pagination: Pagination | undefined;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  onPaymentClick: (payment: PaymentHistoryItem) => void;
  onPageChange: (page: number) => void;
}

export function PaymentHistoryTable({
  payments,
  pagination,
  isLoading,
  error,
  onRetry,
  onPaymentClick,
  onPageChange,
}: PaymentHistoryTableProps) {
  if (isLoading) {
    return <TableSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load payment history"
        description={
          error.message || "Something went wrong while loading payment history."
        }
        action={<Button onClick={onRetry}>Try Again</Button>}
      />
    );
  }

  if (payments.length === 0) {
    return (
      <EmptyState
        title="No payments found"
        description="No payments found for this period."
      />
    );
  }

  return (
    <>
      <Table aria-label="Payment history">
        <TableHeader>
          <TableRow>
            <TableHeaderCell scope="col">Order</TableHeaderCell>
            <TableHeaderCell scope="col">Table</TableHeaderCell>
            <TableHeaderCell scope="col">Amount</TableHeaderCell>
            <TableHeaderCell scope="col">Status</TableHeaderCell>
            <TableHeaderCell scope="col">Paid At</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <PaymentHistoryRow
              key={payment.id}
              payment={payment}
              onClick={onPaymentClick}
            />
          ))}
        </TableBody>
      </Table>

      {pagination && pagination.totalPages > 1 && (
        <nav className="history-pagination" aria-label="Payments pagination">
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
