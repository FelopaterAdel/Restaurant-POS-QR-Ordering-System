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
  const average = sales.points.length > 0 ? total / sales.points.length : 0;
  const peak =
    sales.points.length > 0
      ? sales.points.reduce((best, p) => (p.amount > best.amount ? p : best))
      : null;
  const period = sales.granularity === "hourly" ? "by hour" : "by day";
  const periodLabel = sales.granularity === "hourly" ? "Hourly" : "Daily";

  return (
    <Card className="sales-chart-card">
      <CardHeader className="sales-chart-card__head">
        <div className="sales-chart-card__title-row">
          <span className="sales-chart-card__icon" aria-hidden="true">
            <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
              <path d="M3 17h14" />
              <path d="M6 17v-6M10.5 17V7M15 17v-9" />
            </svg>
          </span>
          <CardTitle>Sales</CardTitle>
          <span className="sales-chart-card__pill">{periodLabel}</span>
        </div>
        <div className="sales-chart-card__hero">
          <div>
            <span className="sales-chart-card__total">{formatCurrency(total)}</span>
            <span className="sales-chart-card__avg">
              avg {formatCurrency(Math.round(average))} {period}
            </span>
          </div>
          {peak && peak.amount > 0 && (
            <span className="sales-chart-card__peak">
              Peak · {pointLabel(peak)} · {formatCurrency(peak.amount)}
            </span>
          )}
        </div>
      </CardHeader>
      <CardBody className="sales-chart-card__body">
        <div
          className="sales-chart"
          role="img"
          aria-label={`Sales ${period}, total ${formatCurrency(total)}`}
        >
          <div className="sales-chart__gridlines" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="sales-chart__bars">
            {sales.points.map((point, index) => {
              const isPeak = peak !== null && point.key === peak.key && point.amount > 0;
              return (
                <div key={point.key} className="sales-chart__column">
                  <div
                    className={`sales-chart__bar${point.amount > 0 ? "" : " sales-chart__bar--empty"}${isPeak ? " sales-chart__bar--peak" : ""}`}
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
              );
            })}
          </div>
          <div className="sales-chart__baseline" aria-hidden="true" />
        </div>
        <div className="sales-chart-card__foot">
          <div className="sales-chart-card__stat">
            <span className="sales-chart-card__stat-label">Total</span>
            <span className="sales-chart-card__stat-value">{formatCurrency(total)}</span>
          </div>
          <div className="sales-chart-card__stat">
            <span className="sales-chart-card__stat-label">Average</span>
            <span className="sales-chart-card__stat-value">{formatCurrency(Math.round(average))}</span>
          </div>
          <div className="sales-chart-card__stat">
            <span className="sales-chart-card__stat-label">Peak</span>
            <span className="sales-chart-card__stat-value">
              {peak && peak.amount > 0 ? `${pointLabel(peak)}` : "—"}
            </span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
