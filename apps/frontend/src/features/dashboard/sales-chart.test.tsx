// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SalesChart } from "./components/SalesChart";
import type { DashboardSales } from "./dashboard.types";

function buildSales(overrides: Partial<DashboardSales> = {}): DashboardSales {
  return {
    granularity: "hourly",
    points: [
      { key: "12", amount: 100 },
      { key: "13", amount: 400 },
      { key: "14", amount: 0 },
    ],
    ...overrides,
  };
}

describe("SalesChart", () => {
  it("renders a bar for every point with accessible labels", () => {
    render(<SalesChart sales={buildSales()} />);

    expect(screen.getByLabelText("12:00: 100 EGP")).toBeInTheDocument();
    expect(screen.getByLabelText("13:00: 400 EGP")).toBeInTheDocument();
    expect(screen.getByLabelText("14:00: 0 EGP")).toBeInTheDocument();
  });

  it("describes the total sales for screen readers", () => {
    render(<SalesChart sales={buildSales()} />);

    expect(screen.getByRole("img")).toHaveAttribute(
      "aria-label",
      "Sales by hour, total 500 EGP",
    );
  });

  it("labels daily granularity with formatted dates", () => {
    render(
      <SalesChart
        sales={buildSales({
          granularity: "daily",
          points: [
            { key: "2026-08-17", amount: 300 },
            { key: "2026-08-18", amount: 700 },
          ],
        })}
      />,
    );

    expect(screen.getByLabelText("Aug 17: 300 EGP")).toBeInTheDocument();
    expect(screen.getByLabelText("Aug 18: 700 EGP")).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute(
      "aria-label",
      "Sales by day, total 1,000 EGP",
    );
  });

  it("scales the tallest bar to full height", () => {
    const { container } = render(<SalesChart sales={buildSales()} />);

    const bars = container.querySelectorAll<HTMLElement>(".sales-chart__bar");

    expect(bars[0].style.height).toBe("25%");
    expect(bars[1].style.height).toBe("100%");
    expect(bars[2].style.height).toBe("2%");
  });
});
