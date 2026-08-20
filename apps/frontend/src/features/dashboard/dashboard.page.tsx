import { useCallback, useMemo, useState } from "react";
import { Button, Card, CardBody, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { useRestaurant } from "@/features/settings/restaurant-context";
import { DashboardHeader } from "./components/DashboardHeader";
import { DateFilter, type DatePreset } from "./components/DateFilter";
import { OrderStatusCard } from "./components/OrderStatusCard";
import {
  BanknoteIcon,
  CheckCircleIcon,
  ClockIcon,
  ReceiptIcon,
} from "./components/icons";
import { StatCard } from "./components/StatCard";
import { useDashboardQuery } from "./dashboard.queries";
import type { DashboardSummary } from "./dashboard.types";
import "./dashboard.css";

function formatCurrency(value: number): string {
  return `EGP ${value.toLocaleString("en-US")}`;
}

function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDateForPreset(preset: DatePreset, customDate: string): string | undefined {
  const now = new Date();
  switch (preset) {
    case "today":
      return toDateString(now);
    case "yesterday": {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      return toDateString(yesterday);
    }
    case "custom":
      return customDate || toDateString(now);
  }
}

function formatDateLabel(preset: DatePreset, customDate: string): string {
  const now = new Date();
  switch (preset) {
    case "today":
      return now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    case "yesterday": {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      return yesterday.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
    case "custom": {
      if (!customDate) return "Select a date";
      const [y, m, d] = customDate.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  }
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function DashboardSkeleton() {
  return (
    <div className="dashboard-grid" aria-label="Loading dashboard">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardBody className="stat-card">
            <Skeleton className="skeleton-line" />
            <Skeleton className="skeleton-value" />
            <Skeleton className="skeleton-line" />
          </CardBody>
        </Card>
      ))}
      <Card className="dashboard-details-skeleton">
        <CardBody>
          <Skeleton className="skeleton-line" />
          <Skeleton className="skeleton-line" />
          <Skeleton className="skeleton-line" />
        </CardBody>
      </Card>
    </div>
  );
}

function DashboardOverview({ summary }: { summary: DashboardSummary }) {
  return (
    <>
      <div className="dashboard-grid">
        <StatCard
          title="Total Sales"
          value={formatCurrency(summary.payments.totalSales)}
          icon={<BanknoteIcon />}
          tone="primary"
        />
        <StatCard
          title="Total Orders"
          value={formatNumber(summary.orders.total)}
          icon={<ReceiptIcon />}
          tone="info"
        />
        <StatCard
          title="Paid Orders"
          value={formatNumber(summary.payments.paidOrders)}
          icon={<CheckCircleIcon />}
          tone="success"
        />
        <StatCard
          title="Active Orders"
          value={formatNumber(
            summary.orders.pending +
              summary.orders.confirmed +
              summary.orders.preparing +
              summary.orders.ready,
          )}
          icon={<ClockIcon />}
          tone="warning"
        />
      </div>
      <div className="dashboard-details">
        <OrderStatusCard orders={summary.orders} />
      </div>
    </>
  );
}

function hasData(summary: DashboardSummary): boolean {
  return (
    summary.orders.total > 0 ||
    summary.payments.totalSales > 0 ||
    summary.payments.paidOrders > 0
  );
}

export function DashboardPage() {
  const { restaurant } = useRestaurant();
  const [datePreset, setDatePreset] = useState<DatePreset>("today");
  const [customDate, setCustomDate] = useState(() => toDateString(new Date()));

  const dateParam = useMemo(
    () => getDateForPreset(datePreset, customDate),
    [datePreset, customDate],
  );

  const { data, isLoading, isError, refetch, isFetching } =
    useDashboardQuery({ date: dateParam });

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const handleDateChange = useCallback(
    (preset: DatePreset, newCustomDate?: string) => {
      setDatePreset(preset);
      if (newCustomDate !== undefined) {
        setCustomDate(newCustomDate);
      }
    },
    [],
  );

  const greeting = `${getGreeting()}, ${restaurant?.name ?? "Restaurant"}`;
  const dateLabel = formatDateLabel(datePreset, customDate);

  return (
    <div className="dashboard">
      <DashboardHeader
        greeting={greeting}
        dateLabel={dateLabel}
        onRefresh={handleRetry}
        isRefreshing={isFetching}
      />
      <DateFilter
        active={datePreset}
        customDate={customDate}
        onChange={handleDateChange}
      />
      {isLoading && <DashboardSkeleton />}
      {isError && (
        <Card>
          <CardBody>
            <ErrorState
              title="Unable to load dashboard data"
              description="Something went wrong while fetching the dashboard."
              action={<Button onClick={handleRetry}>Try Again</Button>}
            />
          </CardBody>
        </Card>
      )}
      {data && !isLoading && !isError && !hasData(data) && (
        <Card>
          <CardBody>
            <EmptyState
              title="No data yet"
              description="There is no activity to display for this date."
            />
          </CardBody>
        </Card>
      )}
      {data && !isLoading && !isError && hasData(data) && (
        <DashboardOverview summary={data} />
      )}
    </div>
  );
}
