import type { OrderStatus } from "@/components/ui";

export const QUEUE_FILTERS = [
  { key: "all", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "PREPARING", label: "Preparing" },
  { key: "READY", label: "Ready" },
] as const;

export type QueueFilterKey = (typeof QUEUE_FILTERS)[number]["key"];

export interface OrderFiltersProps {
  active: QueueFilterKey;
  onChange: (filter: QueueFilterKey) => void;
}

export function OrderFilters({ active, onChange }: OrderFiltersProps) {
  return (
    <div className="orders-filters" role="group" aria-label="Filter orders by status">
      {QUEUE_FILTERS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          className={`orders-filter${active === key ? " orders-filter--active" : ""}`}
          onClick={() => onChange(key)}
          aria-pressed={active === key}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function queueFilterToStatus(
  filter: QueueFilterKey,
): OrderStatus | undefined {
  if (filter === "all") return undefined;
  return filter as OrderStatus;
}
