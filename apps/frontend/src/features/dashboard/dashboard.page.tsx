import { useCallback } from "react";
import { Button, Card, CardBody, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { DashboardHeader } from "./components/DashboardHeader";
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
          hint="Today"
          icon={<BanknoteIcon />}
          tone="primary"
        />
        <StatCard
          title="Total Orders"
          value={formatNumber(summary.orders.total)}
          hint="Today"
          icon={<ReceiptIcon />}
          tone="info"
        />
        <StatCard
          title="Paid Orders"
          value={formatNumber(summary.payments.paidOrders)}
          hint="Paid so far"
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
          hint="In progress"
          icon={<ClockIcon />}
          tone="warning"
        />
      </div>
      <Card className="dashboard-content">
        <CardBody>
          <EmptyState
            title="Activity overview"
            description="Charts and trends will appear in a later sprint."
          />
        </CardBody>
      </Card>
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
  const { data, isLoading, isError, error, refetch } = useDashboardQuery();

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  return (
    <div className="dashboard">
      <DashboardHeader
        title="Dashboard"
        subtitle="Overview of today's restaurant activity"
      />
      {isLoading && <DashboardSkeleton />}
      {isError && (
        <Card>
          <CardBody>
            <ErrorState
              title="Something went wrong"
              description={error?.message ?? "We couldn't load the dashboard."}
              action={<Button onClick={handleRetry}>Try again</Button>}
            />
          </CardBody>
        </Card>
      )}
      {data && !isLoading && !isError && !hasData(data) && (
        <Card>
          <CardBody>
            <EmptyState
              title="No data yet"
              description="There is no activity to display."
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
