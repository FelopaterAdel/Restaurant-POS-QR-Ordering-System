import { useCallback, useEffect, useState } from "react";
import { Button, Card, CardBody, EmptyState, Skeleton } from "@/components/ui";
import { DashboardHeader } from "./components/DashboardHeader";
import {
  BanknoteIcon,
  CheckCircleIcon,
  ClockIcon,
  ReceiptIcon,
} from "./components/icons";
import { StatCard } from "./components/StatCard";
import { fetchDashboardStats } from "./dashboard.mock";
import type { DashboardState, DashboardStats } from "./dashboard.types";
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

function DashboardOverview({ stats }: { stats: DashboardStats }) {
  return (
    <>
      <div className="dashboard-grid">
        <StatCard
          title="Total Sales"
          value={formatCurrency(stats.totalSales)}
          hint="Today"
          icon={<BanknoteIcon />}
          tone="primary"
        />
        <StatCard
          title="Total Orders"
          value={formatNumber(stats.totalOrders)}
          hint="Today"
          icon={<ReceiptIcon />}
          tone="info"
        />
        <StatCard
          title="Paid Orders"
          value={formatNumber(stats.paidOrders)}
          hint="Paid so far"
          icon={<CheckCircleIcon />}
          tone="success"
        />
        <StatCard
          title="Active Orders"
          value={formatNumber(stats.activeOrders)}
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

export function DashboardPage() {
  const [state, setState] = useState<DashboardState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const stats = await fetchDashboardStats();
      if (stats === null) {
        setState({ status: "empty" });
      } else {
        setState({ status: "ready", stats });
      }
    } catch {
      setState({ status: "error", message: "We couldn't load the dashboard." });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="dashboard">
      <DashboardHeader
        title="Dashboard"
        subtitle="Overview of today's restaurant activity"
      />
      {state.status === "loading" && <DashboardSkeleton />}
      {state.status === "empty" && (
        <Card>
          <CardBody>
            <EmptyState
              title="No data yet"
              description="There is no activity to display."
            />
          </CardBody>
        </Card>
      )}
      {state.status === "error" && (
        <Card>
          <CardBody>
            <EmptyState
              title="Something went wrong"
              description={state.message}
              action={<Button onClick={() => void load()}>Try again</Button>}
            />
          </CardBody>
        </Card>
      )}
      {state.status === "ready" && <DashboardOverview stats={state.stats} />}
    </div>
  );
}
