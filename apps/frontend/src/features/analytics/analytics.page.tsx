import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardTitle,
  EmptyState,
  ErrorState,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";
import { formatCurrency } from "@/lib/format";
import {
  useRevenueTrendQuery,
  useStockSummaryQuery,
  useTopProductsQuery,
} from "./analytics.queries";
import type { RevenueGranularity } from "./analytics.types";
import "./analytics.css";

const GRANULARITIES: Array<{ key: RevenueGranularity; label: string }> = [
  { key: "day", label: "Daily" },
  { key: "week", label: "Weekly" },
  { key: "month", label: "Monthly" },
];

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AnalyticsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [granularity, setGranularity] =
    useState<RevenueGranularity>("day");

  const range = from && to ? { from, to } : undefined;

  const topProducts = useTopProductsQuery(range);
  const revenue = useRevenueTrendQuery(range, granularity);
  const stock = useStockSummaryQuery();

  const isLoading =
    topProducts.isLoading || revenue.isLoading || stock.isLoading;
  const error = topProducts.error ?? revenue.error ?? stock.error;

  return (
    <div className="analytics">
      <div className="analytics__header">
        <h1 className="analytics__title">Analytics</h1>
        <div className="analytics__filters">
          <label>
            From
            <input
              type="date"
              aria-label="From date"
              value={from}
              max={to || todayString()}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label>
            To
            <input
              type="date"
              aria-label="To date"
              value={to}
              min={from || undefined}
              max={todayString()}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          {(from || to) && (
            <Button
              variant="outline"
              onClick={() => {
                setFrom("");
                setTo("");
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {isLoading && <p>Loading analytics…</p>}

      {error && !isLoading && (
        <ErrorState
          title="Failed to load analytics"
          description={error.message}
          action={
            <Button
              onClick={() => {
                void topProducts.refetch();
                void revenue.refetch();
                void stock.refetch();
              }}
            >
              Try again
            </Button>
          }
        />
      )}

      {!isLoading && !error && (
        <>
          <section aria-label="Revenue trend">
            <Card>
              <CardBody>
                <div className="analytics__card-head">
                  <CardTitle>Revenue</CardTitle>
                  <div
                    className="analytics__tabs"
                    role="group"
                    aria-label="Granularity"
                  >
                    {GRANULARITIES.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        className={`analytics__tab${granularity === option.key ? " analytics__tab--active" : ""}`}
                        aria-pressed={granularity === option.key}
                        onClick={() => setGranularity(option.key)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                {!revenue.data || revenue.data.length === 0 ? (
                  <EmptyState
                    title="No revenue in this period"
                    description="Paid orders will show up here."
                  />
                ) : (
                  <div className="analytics__chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenue.data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="key" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [
                            formatCurrency(Number(value)),
                            "Revenue",
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="amount"
                          stroke="var(--color-primary)"
                          fill="var(--color-primary-subtle)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardBody>
            </Card>
          </section>

          <section aria-label="Top products">
            <Card>
              <CardBody>
                <CardTitle>Top products</CardTitle>
                {!topProducts.data || topProducts.data.length === 0 ? (
                  <EmptyState
                    title="No sales in this period"
                    description="Completed orders will show up here."
                  />
                ) : (
                  <>
                    <div className="analytics__chart">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={topProducts.data}
                          layout="vertical"
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis
                            type="category"
                            dataKey="productName"
                            width={120}
                          />
                          <Tooltip />
                          <Bar
                            dataKey="quantity"
                            fill="var(--color-primary)"
                            name="Sold"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHeaderCell>Product</TableHeaderCell>
                          <TableHeaderCell>Sold</TableHeaderCell>
                          <TableHeaderCell>Revenue</TableHeaderCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topProducts.data.map((row) => (
                          <TableRow key={row.productId}>
                            <TableCell>{row.productName}</TableCell>
                            <TableCell>{row.quantity}</TableCell>
                            <TableCell>
                              {formatCurrency(row.revenue)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </CardBody>
            </Card>
          </section>

          <section aria-label="Stock overview">
            <Card>
              <CardBody>
                <div className="analytics__card-head">
                  <CardTitle>Stock overview</CardTitle>
                  <Link to="/inventory">Manage inventory</Link>
                </div>
                {stock.data && (
                  <div className="analytics__stats">
                    <span>
                      <strong>{stock.data.totalActive}</strong> active
                    </span>
                    <span>
                      <strong>{stock.data.lowCount}</strong> low
                    </span>
                    <span>
                      <strong>{stock.data.outOfStockCount}</strong> out of
                      stock
                    </span>
                  </div>
                )}
                {!stock.data || stock.data.lowStock.length === 0 ? (
                  <EmptyState
                    title="Stock levels are healthy"
                    description="Ingredients below their thresholds will show up here."
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHeaderCell>Ingredient</TableHeaderCell>
                        <TableHeaderCell>In stock</TableHeaderCell>
                        <TableHeaderCell>Status</TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stock.data.lowStock.map((item) => {
                        const out = Number(item.quantityInStock) <= 0;
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              {item.name} ({item.unit})
                            </TableCell>
                            <TableCell>
                              {String(item.quantityInStock)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={out ? "danger" : "warning"}
                              >
                                {out ? "Out of stock" : "Low stock"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardBody>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
