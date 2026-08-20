import {
  Button,
  Card,
  CardBody,
  EmptyState,
  ErrorState,
  Skeleton,
} from "@/components/ui";
import type { Order, Pagination } from "../orders.types";
import type { UserRole } from "@/features/auth/types";
import { getOrderActions } from "../orders.role-config";
import type { StatusAction } from "../orders.role-config";
import type { QueueFilterKey } from "./OrderFilters";
import { OrderCard } from "./OrderCard";

function OrderGridSkeleton() {
  return (
    <div className="orders-grid" aria-label="Loading orders">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index}>
          <CardBody className="order-skeleton">
            <Skeleton className="skeleton-line" />
            <Skeleton className="skeleton-value" />
            <Skeleton className="skeleton-block" />
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

function EmptyFilterMessage({ filter }: { filter: QueueFilterKey }) {
  if (filter === "all") {
    return (
      <EmptyState
        title="No active orders"
        description="New orders will appear here."
      />
    );
  }

  const label = filter.charAt(0) + filter.slice(1).toLowerCase();
  return (
    <EmptyState
      title={`No ${label.toLowerCase()} orders`}
      description={`Orders with ${label.toLowerCase()} status will appear here.`}
    />
  );
}

export interface OrderQueueProps {
  orders: Order[];
  pagination: Pagination | undefined;
  isLoading: boolean;
  error: Error | null;
  filter: QueueFilterKey;
  onRetry: () => void;
  onOrderClick: (order: Order) => void;
  onPageChange: (page: number) => void;
  role?: UserRole;
  onAction?: (order: Order, action: StatusAction) => void;
  isUpdating?: boolean;
}

export function OrderQueue({
  orders,
  pagination,
  isLoading,
  error,
  filter,
  onRetry,
  onOrderClick,
  onPageChange,
  role,
  onAction,
  isUpdating,
}: OrderQueueProps) {
  if (isLoading) {
    return <OrderGridSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load orders"
        description={error.message || "Something went wrong while loading orders."}
        action={<Button onClick={onRetry}>Try Again</Button>}
      />
    );
  }

  if (orders.length === 0) {
    return <EmptyFilterMessage filter={filter} />;
  }

  return (
    <>
      <div className="orders-grid">
        {orders.map((order) => {
          const actions = role ? getOrderActions(order, role) : [];
          return (
            <OrderCard
              key={order.id}
              order={order}
              onClick={onOrderClick}
              actions={actions.length > 0 ? actions : undefined}
              onAction={onAction}
              isUpdating={isUpdating}
            />
          );
        })}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <nav className="orders-pagination" aria-label="Order pagination">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
          >
            Previous
          </Button>
          <span className="orders-pagination__info">
            Page {pagination.page} of {pagination.totalPages}
          </span>
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
