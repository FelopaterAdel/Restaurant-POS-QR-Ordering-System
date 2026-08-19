// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCart } from "./use-cart";

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
});
