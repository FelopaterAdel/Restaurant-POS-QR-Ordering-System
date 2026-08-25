import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Spinner } from "@/components/ui";
import { getApiErrorMessage } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { usePublicMenuQuery } from "../menu.queries";
import { CategoryTabs } from "./CategoryTabs";
import { ProductGrid } from "./ProductGrid";
import type { PublicProduct } from "../menu.types";
import "../menu.css";

interface PublicMenuViewProps {
  qrCode: string;
  readOnly?: boolean;
  previewBanner?: boolean;
}

export function PublicMenuView({
  qrCode,
  readOnly = false,
  previewBanner = false,
}: PublicMenuViewProps) {
  const navigate = useNavigate();
  const { data: menu, isLoading, error } = usePublicMenuQuery(qrCode);
  const [activeCategoryId, setActiveCategoryId] = useState("");

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

  const handleAdd = useCallback((_product: PublicProduct) => {
    // no-op in read-only / preview
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

  return (
    <main className="menu-page">
      {previewBanner && (
        <div className="menu-page__preview-banner">
          <div className="menu-page__preview-content">
            <span className="menu-page__preview-badge">PREVIEW MODE</span>
            <span className="menu-page__preview-text">Customer Menu</span>
          </div>
        </div>
      )}

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
        {!readOnly && menu.table && (
          <span className="menu-page__table">Table {menu.table.number}</span>
        )}
      </header>

      {menu.categories.length === 0 ? (
        <div className="menu-page__empty">
          <p className="menu-page__empty-title">Your menu is empty.</p>
          <p className="menu-page__empty-message">
            Add categories and products to start building your menu.
          </p>
          <Button variant="primary" onClick={() => navigate("/products")}>
            Add Product
          </Button>
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
                getItemQuantity={() => 0}
                onAdd={handleAdd}
                onIncrement={() => {}}
                onDecrement={() => {}}
              />
            )}
          </div>
        </>
      )}
    </main>
  );
}
