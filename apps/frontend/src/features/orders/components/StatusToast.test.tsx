// @vitest-environment jsdom
import { render, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StatusToast } from "./StatusToast";

describe("StatusToast", () => {
  it("renders success message", () => {
    const { container } = render(
      <StatusToast message="Order marked as ready" type="success" onDismiss={vi.fn()} />,
    );

    const toast = container.querySelector(".status-toast");
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveTextContent("Order marked as ready");
    expect(toast?.className).toContain("status-toast--success");
  });

  it("renders error message", () => {
    const { container } = render(
      <StatusToast message="Unable to update order" type="error" onDismiss={vi.fn()} />,
    );

    const toast = container.querySelector(".status-toast");
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveTextContent("Unable to update order");
    expect(toast?.className).toContain("status-toast--error");
  });

  it("calls onDismiss when dismiss button is clicked", async () => {
    const onDismiss = vi.fn();
    const { container } = render(
      <StatusToast message="Done" type="success" onDismiss={onDismiss} />,
    );

    const user = userEvent.setup();
    const dismissBtn = container.querySelector(".status-toast__dismiss") as HTMLElement;
    await user.click(dismissBtn);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("auto-dismisses success toast after 3 seconds", async () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();

    act(() => {
      render(
        <StatusToast message="Done" type="success" onDismiss={onDismiss} />,
      );
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("does not auto-dismiss error toast", async () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();

    act(() => {
      render(
        <StatusToast message="Error" type="error" onDismiss={onDismiss} />,
      );
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onDismiss).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("has accessible role", () => {
    const { container } = render(
      <StatusToast message="Done" type="success" onDismiss={vi.fn()} />,
    );

    const toast = container.querySelector('[role="status"]');
    expect(toast).toBeInTheDocument();
  });
});
