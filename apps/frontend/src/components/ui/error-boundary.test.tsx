// @vitest-environment jsdom
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { ErrorBoundary } from "./error-boundary";

function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>Child content</div>;
}

afterEach(() => {
  cleanup();
});

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("renders fallback UI when child throws", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
    expect(
      screen.getByText("An unexpected error occurred. Please try again."),
    ).toBeInTheDocument();
  });

  it("renders custom fallback when provided", () => {
    render(
      <ErrorBoundary fallback={<div>Custom error</div>}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Custom error")).toBeInTheDocument();
  });

  it("recovers when Try Again is clicked", async () => {
    const user = userEvent.setup();
    let shouldThrow = true;

    function ConditionalThrower() {
      if (shouldThrow) {
        throw new Error("Conditional error");
      }
      return <div>Recovered</div>;
    }

    function Wrapper({ children }: { children: ReactNode }) {
      return <ErrorBoundary>{children}</ErrorBoundary>;
    }

    const { rerender } = render(
      <Wrapper>
        <ConditionalThrower />
      </Wrapper>,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();

    shouldThrow = false;
    rerender(
      <Wrapper>
        <ConditionalThrower />
      </Wrapper>,
    );

    await user.click(screen.getByRole("button", { name: "Try Again" }));
    expect(screen.getByText("Recovered")).toBeInTheDocument();
  });

  it("does not show stack trace to user", () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    const alerts = screen.getAllByRole("alert");
    for (const alert of alerts) {
      expect(alert.textContent).not.toMatch(/at |\.tsx|\.ts:/);
    }
  });
});
