import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Button, Spinner } from "@/components/ui";
import { getApiErrorMessage } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { usePublicMenuQuery } from "./menu.queries";
import { createPublicOrder } from "./menu.api";
import { useCart } from "./use-cart";
import { CategoryTabs } from "./components/CategoryTabs";
import { ProductGrid } from "./components/ProductGrid";
import { Cart } from "./components/Cart";
import { OrderReview } from "./components/OrderReview";
import { OrderSuccess } from "./components/OrderSuccess";
import type { PublicProduct, CreatePublicOrderResult } from "./menu.types";
import "./menu.css";

type View = "menu" | "review" | "success";

export default function MenuPage() {
  const { qrCode = "" } = useParams();
  const { data: menu, isLoading, error } = usePublicMenuQuery(qrCode);

  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [view, setView] = useState<View>("menu");
  const [orderResult, setOrderResult] = useState<CreatePublicOrderResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const cartMeta = useMemo(
    () =>
      menu
        ? { tableId: menu.table.id, tableNumber: menu.table.number }
        : undefined,
    [menu],
  );
  const cart = useCart(qrCode, cartMeta);

  const effectiveCategoryId = useMemo(() => {
    if (activeCategoryId && menu?.categories.some((c) => c.id === activeCategoryId)) {
      return activeCategoryId;
    }
    return menu?.categories[0]?.id ?? "";
  }, [activeCategoryId, menu?.categories]);

  const activeCategory = useMemo(
    () => menu?.categories.find((c) => c.id === effectiveCategoryId),
    [menu?.categories, effectiveCategoryId],
  );

  const handleAdd = useCallback(
    (product: PublicProduct) => {
      cart.addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
      });
      setCartOpen(true);
    },
    [cart],
  );

  const handleCheckout = useCallback(() => {
    setView("review");
    setCartOpen(false);
  }, []);

  const handleBackToMenu = useCallback(() => {
    setView("menu");
    setSubmitError(null);
  }, []);

  const handlePlaceOrder = useCallback(async () => {
    if (!menu) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const result = await createPublicOrder({
        tableId: menu.table.id,
        items: cart.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      });
      setOrderResult(result);
      cart.clear();
      setView("success");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "TABLE_DISABLED") {
          setSubmitError("This table is currently unavailable. Please ask a staff member for assistance.");
        } else if (err.code === "PRODUCT_NOT_FOUND" || err.code === "PRODUCT_UNAVAILABLE") {
          setSubmitError("Some items are no longer available. Please go back and update your order.");
        } else {
          setSubmitError(getApiErrorMessage(err));
        }
      } else {
        setSubmitError(getApiErrorMessage(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [menu, cart]);

  const handleNewOrder = useCallback(() => {
    setView("menu");
    setOrderResult(null);
    setSubmitError(null);
  }, []);

  if (error) {
    const isDisabled =
      error instanceof ApiError && error.code === "TABLE_DISABLED";
    const isNotFound =
      error instanceof ApiError && error.status === 404;

    return (
      <main className="menu-page">
        <div className="menu-page__error">
          <h2 className="menu-page__error-title">
            {isDisabled
              ? "Table Unavailable"
              : isNotFound
                ? "Table Not Found"
                : "Error Loading Menu"}
          </h2>
          <p className="menu-page__error-message">
            {isDisabled
              ? "This table is currently unavailable. Please ask a staff member for assistance."
              : isNotFound
                ? "We couldn't find a table with that QR code. Please scan the QR code on your table."
                : getApiErrorMessage(error)}
          </p>
          {!isDisabled && !isNotFound && (
            <Button
              variant="primary"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          )}
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="menu-page">
        <div className="menu-page__loading">
          <Spinner />
          <span>Loading menu…</span>
        </div>
      </main>
    );
  }

  if (!menu) return null;

  if (view === "success" && orderResult) {
    return (
      <main className="menu-page">
        <div className="menu-page__content">
          <OrderSuccess
            order={orderResult}
            tableNumber={menu.table.number}
            onNewOrder={handleNewOrder}
          />
        </div>
      </main>
    );
  }

  if (view === "review") {
    return (
      <main className="menu-page">
        <div className="menu-page__content">
          <OrderReview
            items={cart.items}
            totalAmount={cart.totalAmount}
            tableNumber={menu.table.number}
            onConfirm={handlePlaceOrder}
            onBack={handleBackToMenu}
            isSubmitting={isSubmitting}
            error={submitError}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="menu-page">
      <header className="menu-page__header">
        <div className="menu-page__brand">
          {menu.restaurant?.logoUrl && (
            <img
              className="menu-page__logo"
              src={menu.restaurant.logoUrl}
              alt={`${menu.restaurant.name} logo`}
            />
          )}
          <div className="menu-page__brand-text">
            {menu.restaurant ? (
              <>
                <h1 className="menu-page__title">{menu.restaurant.name}</h1>
                <span className="menu-page__subtitle">Menu</span>
              </>
            ) : (
              <h1 className="menu-page__title">Menu</h1>
            )}
          </div>
        </div>
        <span className="menu-page__table">Table {menu.table.number}</span>
      </header>

      {menu.categories.length === 0 ? (
        <div className="menu-page__empty">
          <p className="menu-page__empty-title">No menu available yet</p>
          <p className="menu-page__empty-message">
            Please check back later or ask a staff member for assistance.
          </p>
        </div>
      ) : (
        <>
          <CategoryTabs
            categories={menu.categories}
            activeCategoryId={effectiveCategoryId}
            onSelect={setActiveCategoryId}
          />

          <div className="menu-page__products">
            {activeCategory && (
              <ProductGrid
                products={activeCategory.products}
                getItemQuantity={cart.getItemQuantity}
                onAdd={handleAdd}
                onIncrement={cart.increment}
                onDecrement={cart.decrement}
              />
            )}
          </div>
        </>
      )}

      <Cart
        items={cart.items}
        totalItems={cart.totalItems}
        totalAmount={cart.totalAmount}
        isOpen={cartOpen}
        onToggle={() => setCartOpen((prev) => !prev)}
        onIncrement={cart.increment}
        onDecrement={cart.decrement}
        onRemove={cart.removeItem}
        onCheckout={handleCheckout}
      />
    </main>
  );
}
