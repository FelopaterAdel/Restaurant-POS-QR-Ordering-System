import { useCallback } from "react";
import {
  Button,
  Modal,
  OrderStatusBadge,
  PaymentStatusBadge,
  Spinner,
} from "@/components/ui";
import type { OrderStatus } from "@/components/ui";
import type { UserRole } from "@/features/auth/types";
import type { Order } from "../orders.types";

function formatCurrency(value: number): string {
  return `EGP ${value.toLocaleString("en-US")}`;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

interface StatusAction {
  label: string;
  nextStatus: OrderStatus;
  variant: "primary" | "secondary" | "danger" | "outline";
}

const PAYABLE_ROLES: UserRole[] = ["OWNER", "MANAGER", "CASHIER"];
const PAYABLE_STATUSES: OrderStatus[] = ["READY", "SERVED"];
const COMPLETE_ROLES: UserRole[] = ["OWNER", "MANAGER", "CASHIER"];
const TERMINAL_STATUSES: OrderStatus[] = ["CANCELLED", "COMPLETED"];

function getAvailableActions(
  order: Order,
  role: UserRole,
): StatusAction[] {
  const { status } = order;
  const actions: StatusAction[] = [];

  switch (role) {
    case "KITCHEN":
      if (status === "PENDING") {
        actions.push({ label: "Mark as Confirmed", nextStatus: "CONFIRMED", variant: "primary" });
      }
      if (status === "CONFIRMED") {
        actions.push({ label: "Mark as Preparing", nextStatus: "PREPARING", variant: "primary" });
      }
      if (status === "PREPARING") {
        actions.push({ label: "Mark as Ready", nextStatus: "READY", variant: "primary" });
      }
      break;

    case "WAITER":
      if (status === "READY") {
        actions.push({ label: "Mark as Served", nextStatus: "SERVED", variant: "primary" });
      }
      break;

    case "OWNER":
    case "MANAGER":
      if (status === "PENDING") {
        actions.push({ label: "Confirm", nextStatus: "CONFIRMED", variant: "primary" });
      }
      if (status === "CONFIRMED") {
        actions.push({ label: "Start Preparing", nextStatus: "PREPARING", variant: "primary" });
      }
      if (status === "PREPARING") {
        actions.push({ label: "Mark as Ready", nextStatus: "READY", variant: "primary" });
      }
      if (status === "READY") {
        actions.push({ label: "Mark as Served", nextStatus: "SERVED", variant: "primary" });
      }
      if (["PENDING", "CONFIRMED", "PREPARING"].includes(status)) {
        actions.push({ label: "Cancel Order", nextStatus: "CANCELLED", variant: "danger" });
      }
      break;

    case "CASHIER":
      break;
  }

  return actions;
}

export interface OrderDetailsModalProps {
  open: boolean;
  order: Order | null;
  role: UserRole;
  onClose: () => void;
  onStatusUpdate: (orderId: string, status: OrderStatus) => void;
  onPayOrder: (orderId: string) => void;
  onCompleteOrder: (orderId: string) => void;
  isUpdating: boolean;
}

export function OrderDetailsModal({
  open,
  order,
  role,
  onClose,
  onStatusUpdate,
  onPayOrder,
  onCompleteOrder,
  isUpdating,
}: OrderDetailsModalProps) {
  const handleAction = useCallback(
    (orderId: string, status: OrderStatus) => {
      onStatusUpdate(orderId, status);
    },
    [onStatusUpdate],
  );

  const handlePayClick = useCallback(() => {
    if (order) {
      onPayOrder(order.id);
    }
  }, [order, onPayOrder]);

  const handleCompleteClick = useCallback(() => {
    if (order) {
      onCompleteOrder(order.id);
    }
  }, [order, onCompleteOrder]);

  if (!order) return null;

  const actions = getAvailableActions(order, role);
  const canPay =
    PAYABLE_ROLES.includes(role) &&
    PAYABLE_STATUSES.includes(order.status) &&
    order.paymentStatus === "PENDING";
  const canComplete =
    COMPLETE_ROLES.includes(role) &&
    !TERMINAL_STATUSES.includes(order.status) &&
    order.paymentStatus === "PAID";

  return (
    <Modal
      open={open}
      title={`Order #${order.orderNumber}`}
      onClose={onClose}
      footer={
        <div className="order-details__footer">
          {actions.length > 0 && (
            <div className="order-details__actions">
              {actions.map((action) => (
                <Button
                  key={action.nextStatus}
                  variant={action.variant}
                  size="sm"
                  disabled={isUpdating}
                  onClick={() => handleAction(order.id, action.nextStatus)}
                >
                  {isUpdating ? <Spinner /> : action.label}
                </Button>
              ))}
            </div>
          )}
          {canPay && (
            <div className="order-details__pay">
              <Button
                variant="primary"
                size="sm"
                onClick={handlePayClick}
                disabled={isUpdating}
              >
                Pay Order
              </Button>
            </div>
          )}
          {canComplete && (
            <div className="order-details__complete">
              <Button
                variant="primary"
                size="sm"
                onClick={handleCompleteClick}
                disabled={isUpdating}
              >
                Complete Order
              </Button>
            </div>
          )}
        </div>
      }
    >
      <div className="order-details">
        <div className="order-details__header">
          <div>
            <p className="order-details__table">Table {order.tableNumber}</p>
          </div>
          <div className="order-details__badges">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
        </div>

        <div className="order-details__items">
          {order.items.map((item) => (
            <div key={item.id} className="order-details__item">
              <span className="order-details__item-name">
                {item.productName}
              </span>
              <span className="order-details__item-qty">x{item.quantity}</span>
              <span className="order-details__item-price">
                {formatCurrency(item.totalPrice)}
              </span>
            </div>
          ))}
        </div>

        <div className="order-details__total-row">
          <span className="order-details__total-label">Subtotal</span>
          <span className="order-details__total-value">
            {formatCurrency(order.totalAmount)}
          </span>
        </div>

        <div className="order-details__total-row">
          <span className="order-details__total-label">Total</span>
          <span className="order-details__total-value">
            {formatCurrency(order.totalAmount)}
          </span>
        </div>

        <div className="order-details__info">
          <span>Status: {order.status}</span>
          <span>Created {formatTime(order.createdAt)}</span>
        </div>
      </div>
    </Modal>
  );
}
