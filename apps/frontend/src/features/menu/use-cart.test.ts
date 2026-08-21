// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useCart } from "./use-cart";

afterEach(() => {
  window.sessionStorage.clear();
});

describe("useCart", () => {
  it("starts with empty items", () => {
    const { result } = renderHook(() => useCart());

    expect(result.current.items).toEqual([]);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.totalAmount).toBe(0);
  });

  it("adds an item to the cart", () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addItem({
        productId: "p1",
        name: "Burger",
        price: 100,
      });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toEqual({
      productId: "p1",
      name: "Burger",
      price: 100,
      quantity: 1,
    });
    expect(result.current.totalItems).toBe(1);
    expect(result.current.totalAmount).toBe(100);
  });

  it("increments quantity when adding the same product", () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addItem({ productId: "p1", name: "Burger", price: 100 });
    });
    act(() => {
      result.current.addItem({ productId: "p1", name: "Burger", price: 100 });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.totalItems).toBe(2);
    expect(result.current.totalAmount).toBe(200);
  });

  it("adds multiple different products", () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addItem({ productId: "p1", name: "Burger", price: 100 });
    });
    act(() => {
      result.current.addItem({ productId: "p2", name: "Fries", price: 50 });
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.totalItems).toBe(2);
    expect(result.current.totalAmount).toBe(150);
  });

  it("increments a product quantity", () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addItem({ productId: "p1", name: "Burger", price: 100 });
    });
    act(() => {
      result.current.increment("p1");
    });

    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.totalAmount).toBe(200);
  });

  it("decrements a product quantity", () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addItem({ productId: "p1", name: "Burger", price: 100 });
    });
    act(() => {
      result.current.addItem({ productId: "p1", name: "Burger", price: 100 });
    });
    act(() => {
      result.current.decrement("p1");
    });

    expect(result.current.items[0].quantity).toBe(1);
    expect(result.current.totalAmount).toBe(100);
  });

  it("removes item when decrementing to zero", () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addItem({ productId: "p1", name: "Burger", price: 100 });
    });
    act(() => {
      result.current.decrement("p1");
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.totalAmount).toBe(0);
  });

  it("removes an item by productId", () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addItem({ productId: "p1", name: "Burger", price: 100 });
    });
    act(() => {
      result.current.addItem({ productId: "p2", name: "Fries", price: 50 });
    });
    act(() => {
      result.current.removeItem("p1");
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].productId).toBe("p2");
    expect(result.current.totalAmount).toBe(50);
  });

  it("clears all items", () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addItem({ productId: "p1", name: "Burger", price: 100 });
    });
    act(() => {
      result.current.addItem({ productId: "p2", name: "Fries", price: 50 });
    });
    act(() => {
      result.current.clear();
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.totalAmount).toBe(0);
  });

  it("returns correct getItemQuantity", () => {
    const { result } = renderHook(() => useCart());

    expect(result.current.getItemQuantity("p1")).toBe(0);

    act(() => {
      result.current.addItem({ productId: "p1", name: "Burger", price: 100 });
    });
    act(() => {
      result.current.addItem({ productId: "p1", name: "Burger", price: 100 });
    });

    expect(result.current.getItemQuantity("p1")).toBe(2);
    expect(result.current.getItemQuantity("p2")).toBe(0);
  });

  it("calculates correct totals with mixed quantities", () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addItem({ productId: "p1", name: "Burger", price: 100 });
    });
    act(() => {
      result.current.addItem({ productId: "p1", name: "Burger", price: 100 });
    });
    act(() => {
      result.current.addItem({ productId: "p2", name: "Fries", price: 50 });
    });

    expect(result.current.totalItems).toBe(3);
    expect(result.current.totalAmount).toBe(250);
  });

  describe("session persistence", () => {
    it("persists items with table context to sessionStorage", () => {
      const { result } = renderHook(() =>
        useCart("tbl_qr1", { tableId: "table_1", tableNumber: 5 }),
      );

      act(() => {
        result.current.addItem({ productId: "p1", name: "Burger", price: 100 });
      });

      const raw = window.sessionStorage.getItem(
        "restaurant-pos:cart:tbl_qr1",
      );
      expect(raw).not.toBeNull();

      const session = JSON.parse(raw as string);
      expect(session).toEqual({
        qrCode: "tbl_qr1",
        tableId: "table_1",
        tableNumber: 5,
        items: [{ productId: "p1", name: "Burger", price: 100, quantity: 1 }],
      });
    });

    it("restores items for the same table on remount", () => {
      window.sessionStorage.setItem(
        "restaurant-pos:cart:tbl_qr1",
        JSON.stringify({
          qrCode: "tbl_qr1",
          tableId: "table_1",
          tableNumber: 5,
          items: [{ productId: "p1", name: "Burger", price: 100, quantity: 2 }],
        }),
      );

      const { result } = renderHook(() =>
        useCart("tbl_qr1", { tableId: "table_1", tableNumber: 5 }),
      );

      expect(result.current.items).toEqual([
        { productId: "p1", name: "Burger", price: 100, quantity: 2 },
      ]);
      expect(result.current.totalAmount).toBe(200);
    });

    it("ignores stored items belonging to a different table", () => {
      window.sessionStorage.setItem(
        "restaurant-pos:cart:tbl_other",
        JSON.stringify({
          qrCode: "tbl_other",
          tableId: "table_9",
          tableNumber: 9,
          items: [{ productId: "p1", name: "Burger", price: 100, quantity: 2 }],
        }),
      );

      const { result } = renderHook(() =>
        useCart("tbl_qr1", { tableId: "table_1", tableNumber: 5 }),
      );

      expect(result.current.items).toEqual([]);
    });

    it("discards malformed persisted data", () => {
      window.sessionStorage.setItem(
        "restaurant-pos:cart:tbl_qr1",
        "{ not valid json",
      );

      const { result } = renderHook(() =>
        useCart("tbl_qr1", { tableId: "table_1", tableNumber: 5 }),
      );

      expect(result.current.items).toEqual([]);
    });

    it("removes the stored session when the cart is cleared", () => {
      const { result } = renderHook(() =>
        useCart("tbl_qr1", { tableId: "table_1", tableNumber: 5 }),
      );

      act(() => {
        result.current.addItem({ productId: "p1", name: "Burger", price: 100 });
      });
      act(() => {
        result.current.clear();
      });

      expect(
        window.sessionStorage.getItem("restaurant-pos:cart:tbl_qr1"),
      ).toBeNull();
    });
  });
});
