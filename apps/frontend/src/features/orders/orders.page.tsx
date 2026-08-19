import { useCallback, useState } from "react";
import { Button, Spinner } from "@/components/ui";
import { useAuth } from "@/features/auth/use-auth";
import { useOrderQueueQuery } from "./orders.queries";
import { useUpdateOrderStatusMutation } from "./orders.mutations";
import {
  OrderFilters,
  queueFilterToStatus,
  type QueueFilterKey,
} from "./components/OrderFilters";
import { OrderQueue } from "./components/OrderQueue";
import { OrderDetailsModal } from "./components/OrderDetailsModal";
import type { Order } from "./orders.types";
import type { OrderStatus } from "@/components/ui";
import "./orders.css";

export default function OrdersPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<QueueFilterKey>("all");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const status = queueFilterToStatus(filter);
  const limit = 20;

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useOrderQueueQuery({
    status,
    page,
    limit,
  });

  const updateStatusMutation = useUpdateOrderStatusMutation(
    selectedOrder?.id ?? "",
  );

  const handleFilterChange = useCallback((newFilter: QueueFilterKey) => {
    setFilter(newFilter);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleOrderClick = useCallback((order: Order) => {
    setSelectedOrder(order);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedOrder(null);
    updateStatusMutation.reset();
  }, [updateStatusMutation]);

  const handleStatusUpdate = useCallback(
    (orderId: string, status: OrderStatus) => {
      updateStatusMutation.mutate(
        { status },
        {
          onSuccess: () => {
            setSelectedOrder(null);
          },
        },
      );
    },
    [updateStatusMutation],
  );

  const handleRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  const orders = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div>
      <div className="orders-header">
        <h1 className="orders-header__title">Orders</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          {isLoading ? <Spinner /> : "Refresh"}
        </Button>
      </div>

      <OrderFilters active={filter} onChange={handleFilterChange} />

      <OrderQueue
        orders={orders}
        pagination={pagination}
        isLoading={isLoading}
        error={error}
        filter={filter}
        onRetry={() => void refetch()}
        onOrderClick={handleOrderClick}
        onPageChange={handlePageChange}
      />

      {user && (
        <OrderDetailsModal
          open={selectedOrder !== null}
          order={selectedOrder}
          role={user.role}
          onClose={handleCloseDetails}
          onStatusUpdate={handleStatusUpdate}
          isUpdating={updateStatusMutation.isPending}
        />
      )}
    </div>
  );
}
