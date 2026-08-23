import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api";
import {
  getCompleteOrderErrorMessage,
  getPaymentErrorMessage,
} from "./orders.errors";

describe("getPaymentErrorMessage", () => {
  it("maps PAYMENT_ALREADY_EXISTS to a clear message", () => {
    const error = new ApiError(409, "PAYMENT_ALREADY_EXISTS", "Order is already paid");
    expect(getPaymentErrorMessage(error)).toBe(
      "This order has already been paid.",
    );
  });

  it("maps PAYMENT_NOT_ALLOWED to a clear message", () => {
    const error = new ApiError(409, "PAYMENT_NOT_ALLOWED", "Order in status PENDING cannot be paid");
    expect(getPaymentErrorMessage(error)).toBe(
      "This order can't be paid in its current status.",
    );
  });

  it("maps FORBIDDEN to a permission message", () => {
    const error = new ApiError(403, "FORBIDDEN", "Insufficient role");
    expect(getPaymentErrorMessage(error)).toBe(
      "You don't have permission to record payments.",
    );
  });

  it("falls back to the API message for unmapped codes", () => {
    const error = new ApiError(500, "INTERNAL_SERVER_ERROR", "An unexpected error occurred");
    expect(getPaymentErrorMessage(error)).toBe("An unexpected error occurred");
  });
});

describe("getCompleteOrderErrorMessage", () => {
  it("maps ORDER_NOT_PAID to a clear message", () => {
    const error = new ApiError(409, "ORDER_NOT_PAID", "Order must be paid first");
    expect(getCompleteOrderErrorMessage(error)).toBe(
      "This order must be paid before it can be completed.",
    );
  });

  it("maps ORDER_ALREADY_COMPLETED to a clear message", () => {
    const error = new ApiError(409, "ORDER_ALREADY_COMPLETED", "Already completed");
    expect(getCompleteOrderErrorMessage(error)).toBe(
      "This order has already been completed.",
    );
  });

  it("falls back to the API message for unmapped codes", () => {
    const error = new ApiError(0, "NETWORK_ERROR", "Unable to reach the server");
    expect(getCompleteOrderErrorMessage(error)).toBe("Unable to reach the server");
  });
});
