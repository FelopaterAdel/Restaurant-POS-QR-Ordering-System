import { useCallback, useState } from "react";
import { Button, EmptyState, ErrorState, Spinner } from "@/components/ui";
import { getApiErrorMessage } from "@/lib/api";
import type { Order } from "@/features/orders/orders.types";
import type { StatusAction } from "@/features/orders/orders.role-config";
import { useReadyOrdersQuery } from "./waiter.queries";
import { useWaiterStatusMutation } from "./waiter.mutations";
import { isReadyStatus, sortByReadyPriority } from "./waiter.actions";
import { ReadyOrderCard } from "./components/ReadyOrderCard";
import "./waiter.css";

function ReadyListSkeleton() {
  return (
    <div className="ready-orders" aria-label="Loading ready orders">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="ready-card-skeleton" />
      ))}
    </div>
  );
}

export default function WaiterPage() {
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const { data, isLoading, error, refetch, isFetching } =
    useReadyOrdersQuery();

  const { mutate: mutateStatus, isPending, variables } =
    useWaiterStatusMutation();

  const orders = sortByReadyPriority(
    (data?.data ?? []).filter((order) => isReadyStatus(order.status)),
  );

  const handleMarkServed = useCallback(
    (order: Order, action: StatusAction) => {
      mutateStatus(
        { orderId: order.id, status: action.nextStatus },
        {
          onSuccess: () => {
            setToast({
              message: `Order #${order.orderNumber} marked as served`,
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
    [mutateStatus],
  );

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const handleDismissToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <div className="waiter">
      {toast && (
        <div
          className={`waiter-toast waiter-toast--${toast.type}`}
          role="status"
          aria-live="polite"
        >
          <span className="waiter-toast__message">{toast.message}</span>
          <button
            type="button"
            className="waiter-toast__dismiss"
            onClick={handleDismissToast}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <header className="waiter__header">
        <h1 className="waiter__title">Ready Orders</h1>
        <span
          className="waiter__count"
          aria-label={`${orders.length} ready orders`}
        >
          {orders.length} Ready
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRetry}
          disabled={isLoading || isFetching}
        >
          {isFetching && !isLoading ? <Spinner /> : "Refresh"}
        </Button>
      </header>

      {isLoading ? (
        <ReadyListSkeleton />
      ) : error ? (
        <ErrorState
          title="Unable to load ready orders"
          description={
            error.message ||
            "Something went wrong while loading the ready queue."
          }
          action={<Button onClick={handleRetry}>Try Again</Button>}
        />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No ready orders"
          description="Orders will appear here as soon as the kitchen marks them ready."
        />
      ) : (
        <div className="ready-orders">
          {orders.map((order) => (
            <ReadyOrderCard
              key={order.id}
              order={order}
              onMarkServed={handleMarkServed}
              isUpdating={isPending && variables?.orderId === order.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
