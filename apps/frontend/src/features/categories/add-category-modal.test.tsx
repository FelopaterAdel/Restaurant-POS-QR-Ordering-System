// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AddCategoryModal } from "./components/AddCategoryModal";

describe("AddCategoryModal", () => {
  it("validates required name and submits valid input", async () => {
    const onSubmit = vi.fn();
    render(<AddCategoryModal open onClose={vi.fn()} onSubmit={onSubmit} isPending={false} />);
    const submit = screen.getByRole("button", { name: /create/i });
    await userEvent.click(submit);
    expect(screen.getByText("Name is required")).toBeInTheDocument();
    const name = screen.getByLabelText("Category name");
    await userEvent.type(name, "Desserts");
    await userEvent.click(submit);
    expect(onSubmit).toHaveBeenCalledWith({ name: "Desserts", description: "" });
  });
});
