import { useCallback, useMemo, useState } from "react";
import { Button, EmptyState, Input, Spinner } from "@/components/ui";
import type { PaymentMethod } from "@/components/ui";
import { useAuth } from "@/features/auth/use-auth";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getApiErrorMessage } from "@/lib/api";
import {
  HISTORY_POLL_INTERVAL_MS,
  OPERATIONS_POLL_INTERVAL_MS,
  useOrderDetailQuery,
  useOrderHistoryQuery,
  useOrderQueueQuery,
} from "./orders.queries";
import {
  useUpdateOrderStatusMutation,
  usePayOrderMutation,
  useCompleteOrderMutation,
} from "./orders.mutations";
import { getRoleOrderConfig } from "./orders.role-config";
import type { StatusAction } from "./orders.role-config";
import {
  getCompleteOrderErrorMessage,
  getPaymentErrorMessage,
  isStalePaymentError,
} from "./orders.errors";
import {
  OrderFilters,
  isHistoryFilter,
  queueFilterToStatus,
  type QueueFilterKey,
} from "./components/OrderFilters";
import { OrdersResults } from "./components/OrdersResults";
import { OrderDetailsModal } from "./components/OrderDetailsModal";
import { PaymentConfirmationModal } from "./components/PaymentConfirmationModal";
import { CompleteConfirmationModal } from "./components/CompleteConfirmationModal";
import { StatusToast } from "./components/StatusToast";
import type {
  Order,
  OrderHistoryItem,
  Pagination,
} from "./orders.types";
import type { OrderStatus } from "@/components/ui";
import "./orders.css";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

function historyItemToOrder(item: OrderHistoryItem): Order {
  return {
    id: item.id,
    orderNumber: item.orderNumber,
    tableId: "",
    tableNumber: item.table.number,
    status: item.status,
    paymentStatus: item.payment.status,
    totalAmount: item.totalAmount,
    cancelledAt: null,
    cancelledReason: null,
    createdAt: item.createdAt,
    updatedAt: item.createdAt,
    items: [],
  };
}

function buildEmptyMessage(
  filter: QueueFilterKey,
  hasSearch: boolean,
): { title: string; description: string } {
  if (hasSearch) {
    return {
      title: "No orders found",
      description: "No orders match your search.",
    };
  }
  if (filter === "all") {
    return {
      title: "No active orders",
      description: "New orders will appear here.",
    };
  }
  const label = filter.charAt(0) + filter.slice(1).toLowerCase();
  return {
    title: `No ${label.toLowerCase()} orders`,
    description: `Orders with ${label.toLowerCase()} status will appear here.`,
  };
}

export default function OrdersPage() {
  const { user } = useAuth();
  const roleConfig = user ? getRoleOrderConfig(user.role) : null;

  const [filter, setFilter] = useState<QueueFilterKey>(
    roleConfig?.defaultFilter ?? "all",
  );
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [selected, setSelected] = useState<{
    order: Order;
    needsDetail: boolean;
  } | null>(null);
  const [payingOrder, setPayingOrder] = useState<Order | null>(null);
  const [completingOrder, setCompletingOrder] = useState<Order | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const search = useDebouncedValue(searchInput.trim(), SEARCH_DEBOUNCE_MS);
  const searchOrderNumber = /^\d+$/.test(search) ? Number(search) : undefined;

  const historyStatus = isHistoryFilter(filter)
    ? queueFilterToStatus(filter)
    : undefined;
  const historyMode =
    historyStatus !== undefined || searchOrderNumber !== undefined;

  const status = queueFilterToStatus(filter);

  const queueQuery = useOrderQueueQuery(
    { status, page, limit: PAGE_SIZE },
    {
      refetchInterval: OPERATIONS_POLL_INTERVAL_MS,
      enabled: !historyMode,
    },
  );

  const historyQuery = useOrderHistoryQuery(
    { status: historyStatus, orderNumber: searchOrderNumber, page, limit: PAGE_SIZE },
    {
      refetchInterval: HISTORY_POLL_INTERVAL_MS,
      enabled: historyMode,
    },
  );

  const activeQuery = historyMode ? historyQuery : queueQuery;
  const isLoading = activeQuery.isLoading;
  const error = activeQuery.error;
  const refetch = activeQuery.refetch;

  const orders: Order[] = useMemo(
    () =>
      historyMode
        ? (historyQuery.data?.data ?? []).map(historyItemToOrder)
        : (queueQuery.data?.data ?? []),
    [historyMode, historyQuery.data, queueQuery.data],
  );
  const pagination: Pagination | undefined =
    historyMode ? historyQuery.data?.pagination : queueQuery.data?.pagination;

  const updateStatusMutation = useUpdateOrderStatusMutation(
    selected?.order.id ?? "",
  );

  const payOrderMutation = usePayOrderMutation(payingOrder?.id ?? "");

  const completeOrderMutation = useCompleteOrderMutation(
    completingOrder?.id ?? "",
  );

  const detailOrderId = selected?.needsDetail ? selected.order.id : "";
  const { data: fetchedDetail } = useOrderDetailQuery(detailOrderId);

  const modalOrder = selected
    ? selected.needsDetail
      ? fetchedDetail ?? null
      : selected.order
    : null;

  const handleFilterChange = useCallback((newFilter: QueueFilterKey) => {
    setFilter(newFilter);
    setSearchInput("");
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value.replace(/\D/g, "").slice(0, 6));
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleOrderClick = useCallback((order: Order) => {
    setSelected({ order, needsDetail: false });
  }, []);

  const handleHistoryOrderClick = useCallback((order: Order) => {
    setSelected({ order, needsDetail: true });
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelected(null);
    updateStatusMutation.reset();
  }, [updateStatusMutation]);

  const handleStatusUpdate = useCallback(
    (_orderId: string, nextStatus: OrderStatus) => {
      updateStatusMutation.mutate(
        { status: nextStatus },
        {
          onSuccess: () => {
            setSelected(null);
            setToast({
              message: `Order marked as ${nextStatus.toLowerCase()}`,
              type: "success",
            });
          },
          onError: (mutationError) => {
            setToast({
              message:
                getApiErrorMessage(mutationError) ||
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
          onError: (mutationError) => {
            setToast({
              message:
                getApiErrorMessage(mutationError) ||
                "Unable to update order. The order may have changed.",
              type: "error",
            });
          },
        },
      );
    },
    [updateStatusMutation],
  );

  const findOrder = useCallback(
    (orderId: string) => orders.find((o) => o.id === orderId) ?? null,
    [orders],
  );

  const handlePayOrder = useCallback(
    (orderId: string) => {
      const order = selected?.order.id === orderId
        ? selected.order
        : findOrder(orderId);
      if (order) {
        setPayingOrder(order);
        setSelected(null);
      }
    },
    [selected, findOrder],
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
          onError: (mutationError) => {
            if (isStalePaymentError(mutationError)) {
              // Someone else already paid (or the order changed). The queue
              // has been refetched — drop the dialog and show the outcome.
              setPayingOrder(null);
            }
            setToast({
              message: getPaymentErrorMessage(mutationError),
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
      const order = selected?.order.id === orderId
        ? selected.order
        : findOrder(orderId);
      if (order) {
        setCompletingOrder(order);
        setSelected(null);
      }
    },
    [selected, findOrder],
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
      onError: (mutationError) => {
        setToast({
          message: getCompleteOrderErrorMessage(mutationError),
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

  const emptyMessage = buildEmptyMessage(filter, searchOrderNumber !== undefined);

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

      <div className="orders-toolbar">
        <OrderFilters
          active={filter}
          onChange={handleFilterChange}
          filters={roleConfig?.filters}
        />

        {roleConfig?.canSearch && (
          <div className="orders-search">
            <Input
              label="Search"
              type="text"
              inputMode="numeric"
              placeholder="Order #"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              aria-label="Search orders by number"
            />
          </div>
        )}
      </div>

      <OrdersResults
        orders={orders}
        pagination={pagination}
        isLoading={isLoading}
        error={error}
        showItems={!historyMode}
        role={user?.role}
        emptyState={
          <EmptyState
            title={emptyMessage.title}
            description={emptyMessage.description}
          />
        }
        onRetry={() => void refetch()}
        onOrderClick={historyMode ? handleHistoryOrderClick : handleOrderClick}
        onPageChange={handlePageChange}
        onAction={handleCardAction}
        isUpdating={updateStatusMutation.isPending}
      />

      {user && (
        <OrderDetailsModal
          open={selected !== null}
          order={modalOrder}
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
            ? getPaymentErrorMessage(payOrderMutation.error)
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
            ? getCompleteOrderErrorMessage(completeOrderMutation.error)
            : null
        }
      />
    </div>
  );
}
