import { useCallback, useMemo, useReducer } from "react";
import type { CartItem } from "./menu.types";

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD"; item: Omit<CartItem, "quantity"> }
  | { type: "REMOVE"; productId: string }
  | { type: "INCREMENT"; productId: string }
  | { type: "DECREMENT"; productId: string }
  | { type: "CLEAR" };

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

export function useCart() {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

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
