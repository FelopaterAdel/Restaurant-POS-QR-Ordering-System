import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui";
import { formatCurrency } from "@/lib/format";
import { formatShortDate } from "../date-utils";
import type { DashboardSales, DashboardSalesPoint } from "../dashboard.types";

export interface SalesChartProps {
  sales: DashboardSales;
}

function pointLabel(point: DashboardSalesPoint): string {
  return point.key.length === 10 ? formatShortDate(point.key) : `${point.key}:00`;
}

function pointTooltip(point: DashboardSalesPoint): string {
  return `${pointLabel(point)} — ${formatCurrency(point.amount)}`;
}

function shouldShowLabel(index: number, total: number): boolean {
  if (total <= 12) {
    return true;
  }
  return index % 4 === 0;
}

export function SalesChart({ sales }: SalesChartProps) {
  const max = Math.max(...sales.points.map((point) => point.amount), 1);
  const total = sales.points.reduce((sum, point) => sum + point.amount, 0);
  const period = sales.granularity === "hourly" ? "by hour" : "by day";

  return (
    <Card className="sales-chart-card">
      <CardHeader>
        <CardTitle>Sales</CardTitle>
        <span className="sales-chart-card__meta">{period}</span>
      </CardHeader>
      <CardBody>
        <div
          className="sales-chart"
          role="img"
          aria-label={`Sales ${period}, total ${formatCurrency(total)}`}
        >
          <div className="sales-chart__bars">
            {sales.points.map((point, index) => (
              <div key={point.key} className="sales-chart__column">
                <div
                  className={`sales-chart__bar${point.amount > 0 ? "" : " sales-chart__bar--empty"}`}
                  style={{ height: `${Math.max((point.amount / max) * 100, 2)}%` }}
                  title={pointTooltip(point)}
                  aria-label={`${pointLabel(point)}: ${formatCurrency(point.amount)}`}
                />
                {shouldShowLabel(index, sales.points.length) && (
                  <span className="sales-chart__label">
                    {pointLabel(point)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
