import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import type { PaymentConfirmInput } from "@/features/orders/components/PaymentConfirmationModal";
import { hasRole } from "@/features/auth/permissions";
import { useAuth } from "@/features/auth/use-auth";
import { PaymentConfirmationModal } from "@/features/orders/components/PaymentConfirmationModal";
import { StatusToast } from "@/features/orders/components/StatusToast";
import {
  getCompleteOrderErrorMessage,
  getPaymentErrorMessage,
  isStalePaymentError,
} from "@/features/orders/orders.errors";
import {
  useCompleteOrderMutation,
  usePayOrderMutation,
} from "@/features/orders/orders.mutations";
import {
  usePayableOrderSearch,
  usePayableOrdersQuery,
} from "./payments.queries";
import type { PayableOrder } from "./payments.queries";
import { PayableOrderCard } from "./components/PayableOrderCard";
import { PaymentSuccessModal } from "./components/PaymentSuccessModal";
import "./payments.css";

interface ToastState {
  message: string;
  type: "success" | "error";
}

function parseOrderNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const parsed = Number(trimmed);
  return parsed > 0 ? parsed : null;
}

export default function PaymentsPage() {
  const { user } = useAuth();
  const canViewHistory = user !== null && hasRole(user, ["OWNER", "MANAGER"]);
  const [searchValue, setSearchValue] = useState("");
  const [searchedNumber, setSearchedNumber] = useState<number | null>(null);
  const [flowOrder, setFlowOrder] = useState<PayableOrder | null>(null);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [paidOrder, setPaidOrder] = useState<PayableOrder | null>(null);
  const [payRemaining, setPayRemaining] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const queueQuery = usePayableOrdersQuery();
  const searchQuery = usePayableOrderSearch(searchedNumber);

  const payOrderMutation = usePayOrderMutation(flowOrder?.id ?? "");
  const completeOrderMutation = useCompleteOrderMutation(flowOrder?.id ?? "");

  const isSearching = searchedNumber !== null;
  const orders = isSearching
    ? (searchQuery.data ?? [])
    : (queueQuery.data ?? []);
  const isLoading = isSearching ? searchQuery.isLoading : queueQuery.isLoading;
  const loadError = isSearching ? searchQuery.error : queueQuery.error;

  const handleSearchSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSearchedNumber(parseOrderNumber(searchValue));
    },
    [searchValue],
  );

  const handleClearSearch = useCallback(() => {
    setSearchValue("");
    setSearchedNumber(null);
  }, []);

  const handlePay = useCallback((target: PayableOrder) => {
    setFlowOrder(target);
    setIsConfirmingPayment(true);
  }, []);

  const handleClosePayment = useCallback(() => {
    setIsConfirmingPayment(false);
    setFlowOrder(null);
    setPayRemaining(null);
    payOrderMutation.reset();
  }, [payOrderMutation]);

  const handleConfirmPayment = useCallback(
    (input: PaymentConfirmInput) => {
      payOrderMutation.mutate(
        input,
        {
          onSuccess: (payment) => {
            if (payment.orderPaid) {
              setIsConfirmingPayment(false);
              setPaidOrder(flowOrder);
              setPayRemaining(null);
            } else {
              // Split bill: keep the dialog open on the new remainder.
              setPayRemaining(payment.remainingAmount);
              payOrderMutation.reset();
              setToast({
                message: `Partial payment recorded, ${payment.remainingAmount} EGP remaining.`,
                type: "success",
              });
            }
          },
          onError: (error) => {
            if (isStalePaymentError(error)) {
              // The order was paid or changed elsewhere; the queue query has
              // been invalidated and refetched. Close the dialog so the
              // cashier sees the refreshed queue instead of a stale card.
              setIsConfirmingPayment(false);
              setFlowOrder(null);
              payOrderMutation.reset();
              setToast({
                message: getPaymentErrorMessage(error),
                type: "error",
              });
            }
            // Other failures stay inline in the dialog for an immediate retry.
          },
        },
      );
    },
    [flowOrder, payOrderMutation],
  );

  const handleCloseSuccess = useCallback(() => {
    setPaidOrder(null);
    setFlowOrder(null);
    completeOrderMutation.reset();
  }, [completeOrderMutation]);

  const handleCompleteFromSuccess = useCallback(() => {
    completeOrderMutation.mutate(undefined, {
      onSuccess: () => {
        setPaidOrder(null);
        setFlowOrder(null);
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

  const handleRetryQueue = useCallback(() => {
    void queueQuery.refetch();
  }, [queueQuery]);

  const handleDismissToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <div className="payments-page">
      {toast && (
        <StatusToast
          message={toast.message}
          type={toast.type}
          onDismiss={handleDismissToast}
        />
      )}

      <div className="payments-header">
        <h1 className="payments-header__title">Payments</h1>
        {canViewHistory && (
          <Link className="payments-header__link" to="/payments/history">
            Payment History
          </Link>
        )}
      </div>

      <form
        className="payments-search"
        role="search"
        onSubmit={handleSearchSubmit}
      >
        <label className="payments-search__label" htmlFor="payments-search-input">
          Search Order #
        </label>
        <input
          id="payments-search-input"
          className="payments-search__input"
          type="search"
          inputMode="numeric"
          autoComplete="off"
          placeholder="Order number e.g. 1024"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
        />
        <Button
          variant="primary"
          size="md"
          type="submit"
          className="payments-search__submit"
        >
          Search
        </Button>
        {isSearching && (
          <Button
            variant="outline"
            size="md"
            type="button"
            onClick={handleClearSearch}
          >
            Clear
          </Button>
        )}
      </form>

      {isSearching && (
        <p className="payments-search__hint" role="status">
          Showing results for order #{searchedNumber}
        </p>
      )}

      {isLoading ? (
        <div className="payments-grid" aria-label="Loading payments">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="payments-skeleton" />
          ))}
        </div>
      ) : loadError ? (
        <ErrorState
          title="Unable to load payments"
          description={
            isSearching
              ? "Could not search for this order. Please try again."
              : "Something went wrong while loading payable orders."
          }
          action={
            isSearching ? (
              <Button variant="outline" onClick={handleClearSearch}>
                Back to queue
              </Button>
            ) : (
              <Button variant="outline" onClick={handleRetryQueue}>
                Try Again
              </Button>
            )
          }
        />
      ) : orders.length === 0 ? (
        <EmptyState
          title={
            isSearching
              ? "No payable order found"
              : "No orders waiting for payment"
          }
          description={
            isSearching
              ? `Order #${searchedNumber} is not waiting for payment.`
              : "Orders appear here once they are READY or SERVED."
          }
        />
      ) : (
        <div className="payments-grid">
          {orders.map((order) => (
            <PayableOrderCard
              key={`${order.id}-${order.status}`}
              orderNumber={order.orderNumber}
              tableNumber={order.tableNumber}
              status={order.status}
              totalAmount={order.totalAmount}
              itemCount={order.itemCount}
              onPay={() => handlePay(order)}
            />
          ))}
        </div>
      )}

      <PaymentConfirmationModal
        open={flowOrder !== null && isConfirmingPayment}
        orderNumber={flowOrder?.orderNumber ?? 0}
        totalAmount={flowOrder?.totalAmount ?? 0}
        remainingAmount={payRemaining ?? flowOrder?.totalAmount}
        onClose={handleClosePayment}
        onConfirm={handleConfirmPayment}
        isProcessing={payOrderMutation.isPending}
        error={
          payOrderMutation.isError
            ? getPaymentErrorMessage(payOrderMutation.error)
            : null
        }
      />

      <PaymentSuccessModal
        open={paidOrder !== null}
        orderNumber={paidOrder?.orderNumber ?? 0}
        amount={paidOrder?.totalAmount ?? 0}
        onClose={handleCloseSuccess}
        onComplete={handleCompleteFromSuccess}
        isCompleting={completeOrderMutation.isPending}
        error={
          completeOrderMutation.isError
            ? getCompleteOrderErrorMessage(completeOrderMutation.error)
            : null
        }
      />
    </div>
  );
}
