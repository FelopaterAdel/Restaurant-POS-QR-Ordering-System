// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DateFilter } from "./components/DateFilter";

describe("DateFilter", () => {
  it("renders three preset tabs", () => {
    const { unmount } = render(
      <DateFilter active="today" customDate="" onChange={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: "Today" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yesterday" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Custom" })).toBeInTheDocument();
    unmount();
  });

  it("marks the active tab", () => {
    const { unmount } = render(
      <DateFilter active="yesterday" customDate="" onChange={vi.fn()} />,
    );

    const yesterdayTab = screen.getByRole("button", { name: "Yesterday" });
    expect(yesterdayTab).toHaveAttribute("aria-pressed", "true");
    unmount();
  });

  it("shows date input when custom is active", () => {
    const { unmount } = render(
      <DateFilter active="custom" customDate="2026-08-20" onChange={vi.fn()} />,
    );

    expect(screen.getByLabelText("Select date")).toBeInTheDocument();
    unmount();
  });

  it("hides date input when custom is not active", () => {
    const { unmount } = render(
      <DateFilter active="today" customDate="" onChange={vi.fn()} />,
    );

    expect(screen.queryByLabelText("Select date")).not.toBeInTheDocument();
    unmount();
  });

  it("calls onChange with preset when a tab is clicked", async () => {
    const onChange = vi.fn();
    const { unmount } = render(
      <DateFilter active="today" customDate="" onChange={onChange} />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Yesterday" }));

    expect(onChange).toHaveBeenCalledWith("yesterday");
    unmount();
  });

  it("calls onChange with custom and date when date input changes", async () => {
    const onChange = vi.fn();
    const { unmount } = render(
      <DateFilter active="custom" customDate="2026-08-20" onChange={onChange} />,
    );

    const user = userEvent.setup();
    const input = screen.getByLabelText("Select date");
    await user.clear(input);
    await user.type(input, "2026-08-15");

    expect(onChange).toHaveBeenCalled();
    unmount();
  });
});
