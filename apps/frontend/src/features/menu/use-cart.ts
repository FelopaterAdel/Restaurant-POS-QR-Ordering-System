import { useCallback, useEffect, useMemo, useReducer } from "react";
import type { CartItem, CartSession } from "./menu.types";

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD"; item: Omit<CartItem, "quantity"> }
  | { type: "REMOVE"; productId: string }
  | { type: "INCREMENT"; productId: string }
  | { type: "DECREMENT"; productId: string }
  | { type: "CLEAR" };

export interface CartMeta {
  tableId: string;
  tableNumber: number;
}

function buildSession(
  qrCode: string,
  meta: CartMeta | undefined,
  items: CartItem[],
): CartSession | null {
  if (!meta) return null;
  return {
    qrCode,
    tableId: meta.tableId,
    tableNumber: meta.tableNumber,
    items,
  };
}

const STORAGE_KEY_PREFIX = "restaurant-pos:cart:";

function isValidCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.productId === "string" &&
    typeof item.name === "string" &&
    typeof item.price === "number" &&
    Number.isFinite(item.price) &&
    typeof item.quantity === "number" &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0
  );
}

function loadStoredItems(qrCode: string): CartItem[] {
  if (!qrCode) return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY_PREFIX + qrCode);
    if (!raw) return [];

    const session = JSON.parse(raw) as Partial<CartSession>;
    if (session.qrCode !== qrCode || !Array.isArray(session.items)) {
      return [];
    }
    return session.items.filter(isValidCartItem);
  } catch {
    return [];
  }
}

function persistItems(
  qrCode: string,
  meta: CartMeta | undefined,
  items: CartItem[],
) {
  if (!qrCode || !meta) return;

  try {
    const storageKey = STORAGE_KEY_PREFIX + qrCode;
    if (items.length === 0) {
      window.sessionStorage.removeItem(storageKey);
      return;
    }

    const session = buildSession(qrCode, meta, items);
    if (!session) return;
    window.sessionStorage.setItem(storageKey, JSON.stringify(session));
  } catch {
    // Storage may be unavailable (private mode); cart still works in memory.
  }
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD": {
      const existing = state.items.find(
        (i) => i.productId === action.item.productId,
      );
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === action.item.productId
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          ),
        };
      }
      return { items: [...state.items, { ...action.item, quantity: 1 }] };
    }
    case "REMOVE":
      return {
        items: state.items.filter((i) => i.productId !== action.productId),
      };
    case "INCREMENT":
      return {
        items: state.items.map((i) =>
          i.productId === action.productId
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        ),
      };
    case "DECREMENT": {
      const item = state.items.find((i) => i.productId === action.productId);
      if (item && item.quantity <= 1) {
        return {
          items: state.items.filter((i) => i.productId !== action.productId),
        };
      }
      return {
        items: state.items.map((i) =>
          i.productId === action.productId
            ? { ...i, quantity: i.quantity - 1 }
            : i,
        ),
      };
    }
    case "CLEAR":
      return { items: [] };
    default:
      return state;
  }
}

export function useCart(qrCode = "", meta?: CartMeta) {
  const [state, dispatch] = useReducer(
    cartReducer,
    qrCode,
    (code: string) => ({ items: loadStoredItems(code) }),
  );

  useEffect(() => {
    persistItems(qrCode, meta, state.items);
  }, [qrCode, meta, state.items]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">) =>
      dispatch({ type: "ADD", item }),
    [],
  );

  const removeItem = useCallback(
    (productId: string) => dispatch({ type: "REMOVE", productId }),
    [],
  );

  const increment = useCallback(
    (productId: string) => dispatch({ type: "INCREMENT", productId }),
    [],
  );

  const decrement = useCallback(
    (productId: string) => dispatch({ type: "DECREMENT", productId }),
    [],
  );

  const clear = useCallback(() => dispatch({ type: "CLEAR" }), []);

  const totalItems = useMemo(
    () => state.items.reduce((sum, item) => sum + item.quantity, 0),
    [state.items],
  );

  const totalAmount = useMemo(
    () =>
      state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [state.items],
  );

  const getItemQuantity = useCallback(
    (productId: string) =>
      state.items.find((i) => i.productId === productId)?.quantity ?? 0,
    [state.items],
  );

  return {
    items: state.items,
    addItem,
    removeItem,
    increment,
    decrement,
    clear,
    totalItems,
    totalAmount,
    getItemQuantity,
  };
}

export type CartReturnType = ReturnType<typeof useCart>;
