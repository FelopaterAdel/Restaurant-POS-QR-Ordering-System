import { useCallback, useMemo, useState } from "react";
import { Button, Card, CardBody, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { formatCurrency, formatNumber } from "@/lib/format";
import { useRestaurant } from "@/features/settings/restaurant-context";
import {
  addDaysToDateString,
  cairoDateString,
  formatLongDate,
  formatShortDate,
  getWeekRange,
} from "./date-utils";
import { DashboardHeader } from "./components/DashboardHeader";
import { DateFilter, type DatePreset } from "./components/DateFilter";
import { OrderStatusCard } from "./components/OrderStatusCard";
import { QuickLinks } from "./components/QuickLinks";
import { SalesChart } from "./components/SalesChart";
import {
  BanknoteIcon,
  CheckCircleIcon,
  ClockIcon,
  ReceiptIcon,
} from "./components/icons";
import { StatCard } from "./components/StatCard";
import { useDashboardQuery } from "./dashboard.queries";
import type { DashboardQueryParams, DashboardSummary } from "./dashboard.types";
import "./dashboard.css";

function formatDateLabel(preset: DatePreset, customDate: string): string {
  const today = cairoDateString();

  switch (preset) {
    case "today":
      return formatLongDate(today);
    case "yesterday":
      return formatLongDate(addDaysToDateString(today, -1));
    case "week": {
      const { from, to } = getWeekRange();
      return `${formatShortDate(from)} – ${formatShortDate(to)}`;
    }
    case "custom": {
      if (!customDate) return "Select a date";
      return formatLongDate(customDate);
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
  const activeOrders =
    summary.orders.pending +
    summary.orders.confirmed +
    summary.orders.preparing +
    summary.orders.ready;
  const kitchenOrders = summary.orders.confirmed + summary.orders.preparing;

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
          value={formatNumber(activeOrders)}
          icon={<ClockIcon />}
          tone="warning"
        />
      </div>
      <div className="dashboard-details">
        <OrderStatusCard orders={summary.orders} />
        <SalesChart sales={summary.sales} />
      </div>
      <QuickLinks
        activeOrders={activeOrders}
        kitchenOrders={kitchenOrders}
        readyOrders={summary.orders.ready}
      />
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
  const [customDate, setCustomDate] = useState(() => cairoDateString());

  const dateParams = useMemo<DashboardQueryParams>(() => {
    const today = cairoDateString();

    switch (datePreset) {
      case "today":
        return { date: today };
      case "yesterday":
        return { date: addDaysToDateString(today, -1) };
      case "week": {
        const { from, to } = getWeekRange();
        return { from, to };
      }
      case "custom":
        return { date: customDate || today };
    }
  }, [datePreset, customDate]);

  const { data, isLoading, isError, refetch, isFetching } =
    useDashboardQuery(dateParams);

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
              description="There is no activity to display for this period."
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
