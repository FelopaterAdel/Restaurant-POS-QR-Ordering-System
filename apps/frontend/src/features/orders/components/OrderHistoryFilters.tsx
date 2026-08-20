import { useCallback } from "react";
import { Button, Input } from "@/components/ui";
import type { OrderStatus } from "@/components/ui";
import { ORDER_STATUSES } from "@/components/ui";

const HISTORY_STATUSES: Array<{ value: OrderStatus | ""; label: string }> = [
  { value: "", label: "All Statuses" },
  ...ORDER_STATUSES.map((s) => ({ value: s, label: s })),
];

export interface OrderHistoryFiltersProps {
  status: OrderStatus | "";
  date: string;
  orderNumber: string;
  onStatusChange: (status: OrderStatus | "") => void;
  onDateChange: (date: string) => void;
  onOrderNumberChange: (orderNumber: string) => void;
  onClear: () => void;
}

function hasActiveFilters(
  status: OrderStatus | "",
  date: string,
  orderNumber: string,
): boolean {
  return status !== "" || date !== "" || orderNumber !== "";
}

export function OrderHistoryFilters({
  status,
  date,
  orderNumber,
  onStatusChange,
  onDateChange,
  onOrderNumberChange,
  onClear,
}: OrderHistoryFiltersProps) {
  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onStatusChange(e.target.value as OrderStatus | "");
    },
    [onStatusChange],
  );

  const isActive = hasActiveFilters(status, date, orderNumber);

  return (
    <div className="history-filters">
      <div className="history-filters__fields">
        <Input
          label="Order #"
          type="number"
          placeholder="Search by number"
          value={orderNumber}
          onChange={(e) => onOrderNumberChange(e.target.value)}
          className="history-filters__input"
        />

        <div className="history-filters__select-wrap">
          <label className="input">
            <span className="input__label">Status</span>
            <select
              className="input__control history-filters__select"
              value={status}
              onChange={handleStatusChange}
            >
              {HISTORY_STATUSES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="history-filters__input"
        />
      </div>

      {isActive && (
        <div className="history-filters__clear">
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
