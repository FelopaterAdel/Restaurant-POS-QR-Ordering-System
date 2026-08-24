import type { ReactNode } from "react";
import {
  Button,
  Card,
  CardBody,
  ErrorState,
  Skeleton,
} from "@/components/ui";
import type { Order, Pagination } from "../orders.types";
import type { UserRole } from "@/features/auth/types";
import { getOrderActions } from "../orders.role-config";
import type { StatusAction } from "../orders.role-config";
import { OrderCard } from "./OrderCard";
import { OrdersTable } from "./OrdersTable";

function OrdersSkeleton() {
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

export interface OrdersResultsProps {
  orders: Order[];
  pagination: Pagination | undefined;
  isLoading: boolean;
  error: Error | null;
  showItems: boolean;
  role?: UserRole;
  emptyState: ReactNode;
  onRetry: () => void;
  onOrderClick: (order: Order) => void;
  onPageChange: (page: number) => void;
  onAction?: (order: Order, action: StatusAction) => void;
  isUpdating?: boolean;
}

export function OrdersResults({
  orders,
  pagination,
  isLoading,
  error,
  showItems,
  role,
  emptyState,
  onRetry,
  onOrderClick,
  onPageChange,
  onAction,
  isUpdating,
}: OrdersResultsProps) {
  if (isLoading) {
    return <OrdersSkeleton />;
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
    return <>{emptyState}</>;
  }

  const getRowActions =
    role && onAction ? (order: Order) => getOrderActions(order, role) : undefined;

  return (
    <>
      <div className="orders-table-region">
        <OrdersTable
          orders={orders}
          showItems={showItems}
          getRowActions={getRowActions}
          onAction={onAction}
          isUpdating={isUpdating}
          onRowClick={onOrderClick}
        />
      </div>

      <div className="orders-cards-region">
        <div className="orders-grid">
          {orders.map((order) => {
            const actions = getRowActions ? getRowActions(order) : [];
            return (
              <OrderCard
                key={order.id}
                order={order}
                onClick={onOrderClick}
                itemCount={showItems ? undefined : null}
                actions={actions.length > 0 ? actions : undefined}
                onAction={onAction}
                isUpdating={isUpdating}
              />
            );
          })}
        </div>
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
