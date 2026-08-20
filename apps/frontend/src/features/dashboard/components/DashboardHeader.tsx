import { Button } from "@/components/ui";

export interface DashboardHeaderProps {
  greeting: string;
  dateLabel: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function DashboardHeader({
  greeting,
  dateLabel,
  onRefresh,
  isRefreshing,
}: DashboardHeaderProps) {
  return (
    <div className="dashboard-header">
      <div className="dashboard-header__text">
        <h1 className="dashboard-header__title h1">{greeting}</h1>
        <p className="dashboard-header__subtitle">{dateLabel}</p>
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={onRefresh}
        disabled={isRefreshing}
        aria-label="Refresh dashboard"
      >
        {isRefreshing ? "Refreshing..." : "Refresh"}
      </Button>
    </div>
  );
}
