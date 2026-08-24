import { useCallback, useState } from "react";
import {
  Button,
  EmptyState,
  ErrorState,
  Spinner,
} from "@/components/ui";
import { getApiErrorMessage } from "@/lib/api";
import type { Order } from "@/features/orders/orders.types";
import type { StatusAction } from "@/features/orders/orders.role-config";
import { useKitchenOrdersQuery } from "./kitchen.queries";
import { useKitchenStatusMutation } from "./kitchen.mutations";
import { isKitchenStatus, sortByKitchenPriority } from "./kitchen.actions";
import { KitchenOrderCard } from "./components/KitchenOrderCard";
import "./kitchen.css";

function KitchenGridSkeleton() {
  return (
    <div className="kitchen__grid" aria-label="Loading kitchen orders">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="kitchen-card-skeleton" />
      ))}
    </div>
  );
}

export default function KitchenPage() {
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const { data, isLoading, error, refetch, isFetching } =
    useKitchenOrdersQuery();

  const { mutate: mutateStatus, isPending, variables } =
    useKitchenStatusMutation();

  const orders = sortByKitchenPriority(
    (data?.data ?? []).filter((order) => isKitchenStatus(order.status)),
  );

  const handleNextAction = useCallback(
    (order: Order, action: StatusAction) => {
      mutateStatus(
        { orderId: order.id, status: action.nextStatus },
        {
          onSuccess: () => {
            setToast({
              message: `Order #${order.orderNumber}: ${action.label.toLowerCase()}`,
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
    <div className="kitchen">
      {toast && (
        <div
          className={`kitchen-toast kitchen-toast--${toast.type}`}
          role="status"
          aria-live="polite"
        >
          <span className="kitchen-toast__message">{toast.message}</span>
          <button
            type="button"
            className="kitchen-toast__dismiss"
            onClick={handleDismissToast}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <header className="kitchen__header">
        <h1 className="kitchen__title">Kitchen</h1>
        <span
          className="kitchen__count"
          aria-label={`${orders.length} active orders`}
        >
          {orders.length} Active Orders
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
        <KitchenGridSkeleton />
      ) : error ? (
        <ErrorState
          title="Unable to load kitchen orders"
          description={
            error.message ||
            "Something went wrong while loading the kitchen display."
          }
          action={<Button onClick={handleRetry}>Try Again</Button>}
        />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No active kitchen orders"
          description="Confirmed orders will appear here automatically."
        />
      ) : (
        <div className="kitchen__grid">
          {orders.map((order) => (
            <KitchenOrderCard
              key={order.id}
              order={order}
              onNextAction={handleNextAction}
              isUpdating={isPending && variables?.orderId === order.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
