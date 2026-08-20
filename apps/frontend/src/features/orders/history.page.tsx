import { useCallback, useMemo, useState } from "react";
import { Button, Spinner } from "@/components/ui";
import { useAuth } from "@/features/auth/use-auth";
import { getApiErrorMessage } from "@/lib/api";
import {
  useOrderHistoryQuery,
  useOrderDetailQuery,
} from "./orders.queries";
import { useUpdateOrderStatusMutation } from "./orders.mutations";
import type { OrderHistoryItem } from "./orders.types";
import type { OrderStatus } from "@/components/ui";
import { OrderHistoryFilters } from "./components/OrderHistoryFilters";
import { OrderHistoryTable } from "./components/OrderHistoryTable";
import { OrderDetailsModal } from "./components/OrderDetailsModal";
import "./orders.css";

export default function OrderHistoryPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [date, setDate] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [page, setPage] = useState(1);
  const [selectedHistoryOrder, setSelectedHistoryOrder] =
    useState<OrderHistoryItem | null>(null);

  const limit = 20;

  const historyParams = useMemo(
    () => ({
      status: status || undefined,
      date: date || undefined,
      orderNumber: orderNumber ? Number(orderNumber) : undefined,
      page,
      limit,
    }),
    [status, date, orderNumber, page],
  );

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useOrderHistoryQuery(historyParams);

  const selectedOrderId = selectedHistoryOrder?.id ?? "";
  const { data: selectedOrder, isLoading: isLoadingDetail } =
    useOrderDetailQuery(selectedOrderId);

  const updateStatusMutation = useUpdateOrderStatusMutation(selectedOrderId);

  const handleStatusChange = useCallback((newStatus: OrderStatus | "") => {
    setStatus(newStatus);
    setPage(1);
  }, []);

  const handleDateChange = useCallback((newDate: string) => {
    setDate(newDate);
    setPage(1);
  }, []);

  const handleOrderNumberChange = useCallback((newOrderNumber: string) => {
    setOrderNumber(newOrderNumber);
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setStatus("");
    setDate("");
    setOrderNumber("");
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleOrderClick = useCallback((order: OrderHistoryItem) => {
    setSelectedHistoryOrder(order);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedHistoryOrder(null);
    updateStatusMutation.reset();
  }, [updateStatusMutation]);

  const handleStatusUpdate = useCallback(
    (_orderId: string, newStatus: OrderStatus) => {
      updateStatusMutation.mutate(
        { status: newStatus },
        {
          onSuccess: () => {
            setSelectedHistoryOrder(null);
            void refetch();
          },
        },
      );
    },
    [updateStatusMutation, refetch],
  );

  const handlePayOrder = useCallback(() => {}, []);

  const handleCompleteOrder = useCallback(() => {}, []);

  const handleRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  const orders = data?.data ?? [];
  const pagination = data?.pagination;

  const modalOrder = isLoadingDetail ? null : selectedOrder ?? null;

  return (
    <div>
      <div className="orders-header">
        <h1 className="orders-header__title">Order History</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          {isLoading ? <Spinner /> : "Refresh"}
        </Button>
      </div>

      <OrderHistoryFilters
        status={status}
        date={date}
        orderNumber={orderNumber}
        onStatusChange={handleStatusChange}
        onDateChange={handleDateChange}
        onOrderNumberChange={handleOrderNumberChange}
        onClear={handleClearFilters}
      />

      <OrderHistoryTable
        orders={orders}
        pagination={pagination}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        onOrderClick={handleOrderClick}
        onPageChange={handlePageChange}
        onClearFilters={handleClearFilters}
      />

      {user && (
        <OrderDetailsModal
          open={selectedHistoryOrder !== null}
          order={modalOrder}
          role={user.role}
          onClose={handleCloseDetails}
          onStatusUpdate={handleStatusUpdate}
          onPayOrder={handlePayOrder}
          onCompleteOrder={handleCompleteOrder}
          isUpdating={updateStatusMutation.isPending}
        />
      )}
    </div>
  );
}
