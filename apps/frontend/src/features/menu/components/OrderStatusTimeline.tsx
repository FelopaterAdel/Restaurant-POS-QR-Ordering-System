import type { PublicOrderStatus } from "../menu.types";

const TIMELINE_STEPS: Array<{ status: PublicOrderStatus; label: string }> = [
  { status: "PENDING", label: "Order received" },
  { status: "CONFIRMED", label: "Confirmed" },
  { status: "PREPARING", label: "Preparing" },
  { status: "READY", label: "Ready" },
  { status: "SERVED", label: "Served" },
  { status: "COMPLETED", label: "Completed" },
];

interface OrderStatusTimelineProps {
  status: PublicOrderStatus;
}

export function OrderStatusTimeline({ status }: OrderStatusTimelineProps) {
  if (status === "CANCELLED") {
    return (
      <p className="order-status-timeline__cancelled" role="status">
        ✕ Order Cancelled
      </p>
    );
  }

  const currentIndex =
    status === "COMPLETED"
      ? TIMELINE_STEPS.length
      : TIMELINE_STEPS.findIndex((step) => step.status === status);

  return (
    <ol className="order-status-timeline">
      {TIMELINE_STEPS.map((step, index) => {
        const state =
          index < currentIndex
            ? "done"
            : index === currentIndex
              ? "current"
              : "pending";

        return (
          <li
            key={step.status}
            className={`order-status-timeline__step order-status-timeline__step--${state}`}
            aria-current={index === currentIndex ? "step" : undefined}
          >
            <span className="order-status-timeline__marker" aria-hidden="true">
              {index < currentIndex ? "✓" : index === currentIndex ? "●" : "○"}
            </span>
            <span className="order-status-timeline__label">{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
