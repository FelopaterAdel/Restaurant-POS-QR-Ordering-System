import { useCallback, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Button, Card, CardBody } from "@/components/ui";
import { formatCurrency, formatNumber } from "@/lib/format";
import { hasRole } from "@/features/auth/permissions";
import { useAuth } from "@/features/auth/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import {
  usePaymentHistoryQuery,
  usePaymentSummaryQuery,
  paymentKeys,
} from "./history.queries";
import {
  useApproveRefundMutation,
  useRejectRefundMutation,
  useRequestRefundMutation,
  useRefundsQuery,
} from "@/features/refunds/refunds.queries";
import { RefundRequestModal } from "@/features/refunds/components/RefundRequestModal";
import type {
  PaymentDatePreset,
  PaymentHistoryItem,
} from "./history.types";
import { PaymentDetailsModal } from "./components/PaymentDetailsModal";
import { PaymentHistoryFilters } from "./components/PaymentHistoryFilters";
import { PaymentHistoryTable } from "./components/PaymentHistoryTable";
import "./payments.css";

const PAGE_SIZE = 20;

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfLocalWeek(date: Date): Date {
  const offset = (date.getDay() + 1) % 7;
  const start = new Date(date);
  start.setDate(date.getDate() - offset);
  return start;
}

function getDateRangeForPreset(
  preset: PaymentDatePreset,
  customFrom: string,
  customTo: string,
): { from?: string; to?: string } {
  const now = new Date();

  switch (preset) {
    case "today": {
      const today = toDateString(now);
      return { from: today, to: today };
    }
    case "yesterday": {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const date = toDateString(yesterday);
      return { from: date, to: date };
    }
    case "week": {
      const from = toDateString(startOfLocalWeek(now));
      const to = toDateString(now);
      return { from, to };
    }
    case "custom":
      return {
        from: customFrom || undefined,
        to: customTo || undefined,
      };
  }
}

function parseOrderNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const parsed = Number(trimmed);
  return parsed > 0 ? parsed : null;
}

function SummaryCards({
  totalSales,
  paidCount,
}: {
  totalSales: number | undefined;
  paidCount: number | undefined;
}) {
  return (
    <div className="phistory-summary">
      <Card>
        <CardBody className="phistory-summary__card">
          <span className="phistory-summary__title">Total Sales</span>
          <p className="phistory-summary__value">
            {totalSales === undefined ? "—" : formatCurrency(totalSales)}
          </p>
        </CardBody>
      </Card>
      <Card>
        <CardBody className="phistory-summary__card">
          <span className="phistory-summary__title">Payments</span>
          <p className="phistory-summary__value">
            {paidCount === undefined ? "—" : formatNumber(paidCount)}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}

function PaymentHistoryContent() {
  const [preset, setPreset] = useState<PaymentDatePreset>("today");
  const [customFrom, setCustomFrom] = useState(() => toDateString(new Date()));
  const [customTo, setCustomTo] = useState(() => toDateString(new Date()));
  const [searchValue, setSearchValue] = useState("");
  const [searchedOrderNumber, setSearchedOrderNumber] = useState<number | null>(
    null,
  );
  const [page, setPage] = useState(1);
  const [selectedPayment, setSelectedPayment] =
    useState<PaymentHistoryItem | null>(null);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const pendingRefunds = useRefundsQuery("PENDING");
  const requestRefund = useRequestRefundMutation();
  const approveRefund = useApproveRefundMutation();
  const rejectRefund = useRejectRefundMutation();

  function refreshPayments() {
    void queryClient.invalidateQueries({ queryKey: paymentKeys.all });
  }

  const range = useMemo(
    () => getDateRangeForPreset(preset, customFrom, customTo),
    [preset, customFrom, customTo],
  );

  const listParams = useMemo(
    () => ({
      from: range.from,
      to: range.to,
      orderNumber: searchedOrderNumber ?? undefined,
      page,
      limit: PAGE_SIZE,
    }),
    [range.from, range.to, searchedOrderNumber, page],
  );

  const summaryParams = useMemo(
    () => ({
      from: range.from,
      to: range.to,
      orderNumber: searchedOrderNumber ?? undefined,
    }),
    [range.from, range.to, searchedOrderNumber],
  );

  const historyQuery = usePaymentHistoryQuery(listParams);
  const summaryQuery = usePaymentSummaryQuery(summaryParams);

  const handlePresetChange = useCallback((next: PaymentDatePreset) => {
    setPreset(next);
    setPage(1);
  }, []);

  const handleCustomRangeChange = useCallback((from: string, to: string) => {
    setCustomFrom(from);
    setCustomTo(to);
    setPage(1);
  }, []);

  const handleSearchValueChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    setSearchedOrderNumber(parseOrderNumber(searchValue));
    setPage(1);
  }, [searchValue]);

  const handleClearSearch = useCallback(() => {
    setSearchValue("");
    setSearchedOrderNumber(null);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((nextPage: number) => {
    setPage(nextPage);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedPayment(null);
  }, []);

  const payments = historyQuery.data?.data ?? [];

  return (
    <div className="payments-page">
      <div className="payments-header">
        <h1 className="payments-header__title">Payment History</h1>
      </div>

      <PaymentHistoryFilters
        preset={preset}
        customFrom={customFrom}
        customTo={customTo}
        searchValue={searchValue}
        isSearching={searchedOrderNumber !== null}
        onPresetChange={handlePresetChange}
        onCustomRangeChange={handleCustomRangeChange}
        onSearchValueChange={handleSearchValueChange}
        onSearchSubmit={handleSearchSubmit}
        onClearSearch={handleClearSearch}
      />

      {!historyQuery.isLoading && !historyQuery.isError && (
        <SummaryCards
          totalSales={summaryQuery.data?.totalSales}
          paidCount={summaryQuery.data?.paidCount}
        />
      )}

      <PaymentHistoryTable
        payments={payments}
        pagination={historyQuery.data?.pagination}
        isLoading={historyQuery.isLoading}
        error={historyQuery.error}
        onRetry={() => void historyQuery.refetch()}
        onPaymentClick={setSelectedPayment}
        onPageChange={handlePageChange}
      />

      {(pendingRefunds.data ?? []).length > 0 && (
        <Card>
          <CardBody>
            <h2>Pending refunds</h2>
            <ul>
              {(pendingRefunds.data ?? []).map((refund) => (
                <li key={refund.id}>
                  <span>
                    Order #{refund.order?.orderNumber ?? "?"} —{" "}
                    {formatCurrency(Number(refund.amount))}
                    {refund.reason ? ` (${refund.reason})` : ""}
                  </span>
                  <Button
                    variant="outline"
                    disabled={approveRefund.isPending}
                    onClick={() =>
                      approveRefund.mutate(
                        { id: refund.id },
                        { onSuccess: refreshPayments },
                      )
                    }
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    disabled={rejectRefund.isPending}
                    onClick={() =>
                      rejectRefund.mutate(
                        { id: refund.id },
                        { onSuccess: refreshPayments },
                      )
                    }
                  >
                    Reject
                  </Button>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <PaymentDetailsModal
        open={selectedPayment !== null}
        payment={selectedPayment}
        onClose={handleCloseDetails}
        canRequestRefund
        onRequestRefund={() => {
          setRefundError(null);
          setRefundOpen(true);
        }}
      />

      <RefundRequestModal
        open={refundOpen && selectedPayment !== null}
        maxAmount={selectedPayment?.amount ?? 0}
        isPending={requestRefund.isPending}
        onClose={() => setRefundOpen(false)}
        onSubmit={(values) => {
          if (!selectedPayment) return;
          requestRefund.mutate(
            {
              paymentId: selectedPayment.id,
              amount: values.amount,
              reason: values.reason,
            },
            {
              onSuccess: () => {
                setRefundOpen(false);
                refreshPayments();
              },
              onError: (error) => {
                setRefundError(error.message);
              },
            },
          );
        }}
      />
      {refundError && (
        <p role="alert" className="payments-page__error">
          {refundError}
        </p>
      )}
    </div>
  );
}

export default function PaymentHistoryPage() {
  const { user } = useAuth();

  // Payment history is a financial reporting view reserved for OWNER/MANAGER,
  // mirroring the dashboard authorization. Uses the existing role utilities.
  if (!user || !hasRole(user, ["OWNER", "MANAGER"])) {
    return <Navigate to="/403" replace />;
  }

  return <PaymentHistoryContent />;
}
