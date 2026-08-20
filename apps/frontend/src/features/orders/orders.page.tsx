import { useCallback, useState } from "react";
import { Button, Spinner } from "@/components/ui";
import type { PaymentMethod } from "@/components/ui";
import { useAuth } from "@/features/auth/use-auth";
import { getApiErrorMessage } from "@/lib/api";
import { useOrderQueueQuery } from "./orders.queries";
import {
  useUpdateOrderStatusMutation,
  usePayOrderMutation,
  useCompleteOrderMutation,
} from "./orders.mutations";
import { getRoleOrderConfig } from "./orders.role-config";
import type { StatusAction } from "./orders.role-config";
import {
  OrderFilters,
  queueFilterToStatus,
  type QueueFilterKey,
} from "./components/OrderFilters";
import { OrderQueue } from "./components/OrderQueue";
import { OrderDetailsModal } from "./components/OrderDetailsModal";
import { PaymentConfirmationModal } from "./components/PaymentConfirmationModal";
import { CompleteConfirmationModal } from "./components/CompleteConfirmationModal";
import { StatusToast } from "./components/StatusToast";
import type { Order } from "./orders.types";
import type { OrderStatus } from "@/components/ui";
import "./orders.css";

export default function OrdersPage() {
  const { user } = useAuth();
  const roleConfig = user ? getRoleOrderConfig(user.role) : null;

  const [filter, setFilter] = useState<QueueFilterKey>(
    roleConfig?.defaultFilter ?? "all",
  );
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [payingOrder, setPayingOrder] = useState<Order | null>(null);
  const [completingOrder, setCompletingOrder] = useState<Order | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const status = queueFilterToStatus(filter);
  const limit = 20;

  const { data, isLoading, error, refetch } = useOrderQueueQuery({
    status,
    page,
    limit,
  });

  const updateStatusMutation = useUpdateOrderStatusMutation(
    selectedOrder?.id ?? "",
  );

  const payOrderMutation = usePayOrderMutation(payingOrder?.id ?? "");

  const completeOrderMutation = useCompleteOrderMutation(
    completingOrder?.id ?? "",
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
    (_orderId: string, status: OrderStatus) => {
      updateStatusMutation.mutate(
        { status },
        {
          onSuccess: () => {
            setSelectedOrder(null);
            setToast({
              message: `Order marked as ${status.toLowerCase()}`,
              type: "success",
            });
          },
          onError: (error) => {
            setToast({
              message:
                getApiErrorMessage(error) ||
                "Unable to update order. The order may have changed.",
              type: "error",
            });
          },
        },
      );
    },
    [updateStatusMutation],
  );

  const handleCardAction = useCallback(
    (order: Order, action: StatusAction) => {
      updateStatusMutation.mutate(
        { status: action.nextStatus },
        {
          onSuccess: () => {
            setToast({
              message: `Order #${order.orderNumber} marked as ${action.nextStatus.toLowerCase()}`,
              type: "success",
            });
          },
          onError: (error) => {
            setToast({
              message:
                getApiErrorMessage(error) ||
                "Unable to update order. The order may have changed.",
              type: "error",
            });
          },
        },
      );
    },
    [updateStatusMutation],
  );

  const handlePayOrder = useCallback(
    (orderId: string) => {
      const order = data?.data.find((o) => o.id === orderId) ?? null;
      if (order) {
        setPayingOrder(order);
        setSelectedOrder(null);
      }
    },
    [data?.data],
  );

  const handleClosePayment = useCallback(() => {
    setPayingOrder(null);
    payOrderMutation.reset();
  }, [payOrderMutation]);

  const handleConfirmPayment = useCallback(
    (method: PaymentMethod) => {
      payOrderMutation.mutate(
        { method },
        {
          onSuccess: () => {
            setPayingOrder(null);
            setToast({ message: "Payment recorded", type: "success" });
          },
          onError: (error) => {
            setToast({
              message: getApiErrorMessage(error) || "Payment failed",
              type: "error",
            });
          },
        },
      );
    },
    [payOrderMutation],
  );

  const handleCompleteOrder = useCallback(
    (orderId: string) => {
      const order = data?.data.find((o) => o.id === orderId) ?? null;
      if (order) {
        setCompletingOrder(order);
        setSelectedOrder(null);
      }
    },
    [data?.data],
  );

  const handleCloseComplete = useCallback(() => {
    setCompletingOrder(null);
    completeOrderMutation.reset();
  }, [completeOrderMutation]);

  const handleConfirmComplete = useCallback(() => {
    completeOrderMutation.mutate(undefined, {
      onSuccess: () => {
        setCompletingOrder(null);
        setToast({ message: "Order completed", type: "success" });
      },
      onError: (error) => {
        setToast({
          message: getApiErrorMessage(error) || "Unable to complete order",
          type: "error",
        });
      },
    });
  }, [completeOrderMutation]);

  const handleRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  const handleDismissToast = useCallback(() => {
    setToast(null);
  }, []);

  const orders = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div>
      {toast && (
        <StatusToast
          message={toast.message}
          type={toast.type}
          onDismiss={handleDismissToast}
        />
      )}

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

      <OrderFilters
        active={filter}
        onChange={handleFilterChange}
        filters={roleConfig?.filters}
      />

      <OrderQueue
        orders={orders}
        pagination={pagination}
        isLoading={isLoading}
        error={error}
        filter={filter}
        onRetry={() => void refetch()}
        onOrderClick={handleOrderClick}
        onPageChange={handlePageChange}
        role={user?.role}
        onAction={handleCardAction}
        isUpdating={updateStatusMutation.isPending}
      />

      {user && (
        <OrderDetailsModal
          open={selectedOrder !== null}
          order={selectedOrder}
          role={user.role}
          onClose={handleCloseDetails}
          onStatusUpdate={handleStatusUpdate}
          onPayOrder={handlePayOrder}
          onCompleteOrder={handleCompleteOrder}
          isUpdating={updateStatusMutation.isPending}
        />
      )}

      <PaymentConfirmationModal
        open={payingOrder !== null}
        orderNumber={payingOrder?.orderNumber ?? 0}
        totalAmount={payingOrder?.totalAmount ?? 0}
        onClose={handleClosePayment}
        onConfirm={handleConfirmPayment}
        isProcessing={payOrderMutation.isPending}
        error={
          payOrderMutation.isError
            ? getApiErrorMessage(payOrderMutation.error)
            : null
        }
      />

      <CompleteConfirmationModal
        open={completingOrder !== null}
        orderNumber={completingOrder?.orderNumber ?? 0}
        tableNumber={completingOrder?.tableNumber ?? 0}
        onClose={handleCloseComplete}
        onConfirm={handleConfirmComplete}
        isProcessing={completeOrderMutation.isPending}
        error={
          completeOrderMutation.isError
            ? getApiErrorMessage(completeOrderMutation.error)
            : null
        }
      />
    </div>
  );
}
