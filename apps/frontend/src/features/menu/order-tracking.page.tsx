import { useParams } from "react-router-dom";
import { Button, Spinner } from "@/components/ui";
import { usePublicMenuQuery, usePublicOrderQuery } from "./menu.queries";
import { OrderStatusTimeline } from "./components/OrderStatusTimeline";
import { formatPrice } from "./format-price";
import "./menu.css";

export default function OrderTrackingPage() {
  const { qrCode = "", orderId = "" } = useParams();
  const orderQuery = usePublicOrderQuery(orderId, qrCode);
  const menuQuery = usePublicMenuQuery(qrCode);

  const restaurant = menuQuery.data?.restaurant ?? null;
  const order = orderQuery.data;

  return (
    <main className="menu-page">
      <header className="menu-page__header">
        <div className="menu-page__brand">
          {restaurant?.logoUrl && (
            <img
              className="menu-page__logo"
              src={restaurant.logoUrl}
              alt={`${restaurant.name} logo`}
            />
          )}
          <div className="menu-page__brand-text">
            <h1 className="menu-page__title">
              {restaurant ? restaurant.name : "Your Order"}
            </h1>
            <span className="menu-page__subtitle">Your Order</span>
          </div>
        </div>
      </header>

      <div className="menu-page__content">
        {orderQuery.isPending && (
          <div className="menu-page__loading" role="status">
            <Spinner />
            <span>Loading your order...</span>
          </div>
        )}

        {orderQuery.isError && (
          <div className="menu-page__error">
            <h2 className="menu-page__error-title">Unable to load your order</h2>
            <p className="menu-page__error-message">
              Please try again in a moment.
            </p>
            <Button
              variant="primary"
              onClick={() => {
                void orderQuery.refetch();
              }}
            >
              Try Again
            </Button>
          </div>
        )}

        {order && (
          <section className="order-tracking" aria-live="polite">
            <h2 className="order-tracking__title">
              Order #{order.orderNumber}
            </h2>
            <p className="order-tracking__table">Table {order.tableNumber}</p>

            <OrderStatusTimeline status={order.status} />

            {order.status === "CANCELLED" && order.cancelledReason && (
              <p className="order-tracking__cancel-reason">
                {order.cancelledReason}
              </p>
            )}

            <ul className="order-tracking__items">
              {order.items.map((item) => (
                <li key={item.id} className="order-tracking__item">
                  <span className="order-tracking__item-name">
                    {item.productName} × {item.quantity}
                  </span>
                  <span className="order-tracking__item-price">
                    {formatPrice(item.totalPrice)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="order-tracking__total">
              <span>Total</span>
              <span className="order-tracking__total-amount">
                {formatPrice(order.totalAmount)}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="order-tracking__back-btn"
              onClick={() => {
                window.location.assign(`/public/menu/${encodeURIComponent(qrCode)}`);
              }}
            >
              ← Back to Menu
            </Button>
          </section>
        )}
      </div>
    </main>
  );
}
